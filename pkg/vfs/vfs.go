package vfs

import (
	"bytes"
	"compress/gzip"
	"crypto/aes"
	"crypto/cipher"
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"crypto/sha512"
	"encoding/hex"
	"fmt"
	"io"
	"log"
	"math"
	"mime"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"sync"
	"syscall"
	"time"

	"github.com/oarkflow/previewer/pkg/acl"
)

// LogCallback is a function type for security incident logging
// Users can set a custom callback to send security breach logs to backend
type LogCallback func(data map[string]any)

// Global callback for security incidents (default is no-op)
var securityLogCallback LogCallback = func(data map[string]any) {

}

// SetLogCallback allows users to set a custom callback for security incidents
// This enables sending security breach logs to external systems (e.g., backend API, SIEM)
//
// Example usage:
//
//	vfs.SetLogCallback(func(data map[string]any) {
//	    // Send to backend
//	    sendToBackend("/api/security-log", data)
//	})
func SetLogCallback(callback LogCallback) {
	if callback != nil {
		securityLogCallback = callback
	}
}

// logSecurityIncident logs a security incident and invokes the callback
func logSecurityIncident(incidentType, severity, message string, details map[string]any) {
	data := map[string]any{
		"timestamp":     time.Now().Unix(),
		"incident_type": incidentType,
		"severity":      severity,
		"message":       message,
		"details":       details,
	}

	// Always log to console
	log.Printf("[SECURITY %s] %s: %s", strings.ToUpper(severity), incidentType, message)

	// Invoke user callback
	securityLogCallback(data)
}

const ShutdownTimeout = 5 * time.Second
const defaultMaxFileSize = 100 * 1024 * 1024 // 100MB max per file
const defaultMaxTotalSize = 500 * 1024 * 1024 // 500MB max total
const defaultMaxAccessPerFile = 1000 // Max access attempts per file
const rateLimitWindow = 1 * time.Minute // Rate limit time window
const maxPathLength = 4096 // Maximum path length
const encryptionKeySize = 32 // AES-256
const compressionThreshold = 1024 // Compress files > 1KB

// Options configures VFS behavior
type Options struct {
	MaxFileSize       int64 // Maximum size per file
	MaxTotalSize      int64 // Maximum total folder size
	EnableCompression bool  // Enable gzip compression for text files
	LogCallback	  LogCallback // Custom log callback for security incidents
	MaxAccessPerFile  int   // Rate limit per file
	AnomalyThreshold  int   // Anomaly detection threshold (0-100)
	MLockMemory       bool  // Lock memory to prevent swapping
}

// DefaultOptions returns default configuration
func DefaultOptions() Options {
	return Options{
		MaxFileSize:       defaultMaxFileSize,
		MaxTotalSize:      defaultMaxTotalSize,
		EnableCompression: true,
		MaxAccessPerFile:  defaultMaxAccessPerFile,
		AnomalyThreshold:  75,
		MLockMemory:       false,
	}
}

// FileAccessRecord tracks access attempts for anomaly detection
type FileAccessRecord struct {
	Path            string
	AccessCount     int
	LastAccess      time.Time
	FirstAccess     time.Time
	FailedAttempts  int
	IPAddresses     map[string]int // Track which IPs accessed
	AnomalyScore    float64        // ML anomaly score
	SuspiciousFlags []string       // List of suspicious behaviors
}

// VirtualFile represents a file stored in memory with tamper protection
type VirtualFile struct {
	Path         string    // Relative path from folder root
	Name         string    // File name
	Data         []byte    // Encrypted file content
	Size         int64     // Original file size (before encryption)
	MimeType     string    // MIME type
	Hash         string    // SHA256 hash of ORIGINAL content
	HMAC         string    // HMAC for tamper detection
	ModTime      time.Time // Modification time
	Permissions  *acl.ItemPermissions
	AccessCount  int       // Track access attempts
	CreatedAt    time.Time // VFS creation timestamp
	isEncrypted  bool      // Flag indicating encryption status
	isCompressed bool      // Flag indicating compression status
}

// VirtualFileSystem represents a secure tamper-proof in-memory filesystem sandbox
type VirtualFileSystem struct {
	rootPath      string // Original folder path (for reference only)
	files         map[string]*VirtualFile // Path -> VirtualFile
	totalSize     int64
	mu            sync.RWMutex
	readOnly      bool
	encryptionKey []byte // AES-256 key for data encryption
	hmacKey       []byte // Separate key for HMAC
	accessLog     map[string]*FileAccessRecord // Path -> Access tracking
	accessMu      sync.RWMutex
	createdAt     time.Time
	sealed        bool       // Once sealed, no modifications allowed
	options       Options // Configuration options
}

// NewVirtualFileSystem creates a new in-memory filesystem from a folder with encryption
func NewVirtualFileSystem(folderPath string) (*VirtualFileSystem, error) {
	return NewVirtualFileSystemWithOptions(folderPath, DefaultOptions())
}

// NewVirtualFileSystemWithOptions creates a VFS with custom options
func NewVirtualFileSystemWithOptions(folderPath string, options Options) (*VirtualFileSystem, error) {
	// Generate cryptographic keys for encryption and HMAC
	encryptionKey := make([]byte, encryptionKeySize)
	hmacKey := make([]byte, encryptionKeySize)

	if _, err := io.ReadFull(rand.Reader, encryptionKey); err != nil {
		return nil, fmt.Errorf("failed to generate encryption key: %w", err)
	}
	if _, err := io.ReadFull(rand.Reader, hmacKey); err != nil {
		return nil, fmt.Errorf("failed to generate HMAC key: %w", err)
	}

	// Lock memory to prevent swapping if requested (requires privileges)
	if options.MLockMemory {
		if err := syscall.Mlockall(syscall.MCL_CURRENT | syscall.MCL_FUTURE); err != nil {
			log.Printf("Warning: Failed to lock memory (requires root): %v", err)
		} else {
			log.Println("Memory locked: swap protection enabled")
		}
	}

	vfs := &VirtualFileSystem{
		rootPath:      folderPath,
		files:         make(map[string]*VirtualFile),
		accessLog:     make(map[string]*FileAccessRecord),
		readOnly:      true,
		encryptionKey: encryptionKey,
		hmacKey:       hmacKey,
		createdAt:     time.Now(),
		sealed:        false,
		options:       options,
	}

	err := vfs.loadFolder(folderPath, "")
	if err != nil {
		return nil, fmt.Errorf("failed to load folder into VFS: %w", err)
	}

	// Seal the VFS - no more modifications allowed
	vfs.sealed = true

	log.Printf("VFS initialized: %d files, total size: %.2f MB, encrypted: YES, compressed: %v, sealed: YES",
		len(vfs.files), float64(vfs.totalSize)/(1024*1024), options.EnableCompression)

	return vfs, nil
}

// encryptData encrypts data using AES-256-GCM
func (vfs *VirtualFileSystem) encryptData(plaintext []byte) ([]byte, error) {
	block, err := aes.NewCipher(vfs.encryptionKey)
	if err != nil {
		return nil, err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}

	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return nil, err
	}

	ciphertext := gcm.Seal(nonce, nonce, plaintext, nil)
	return ciphertext, nil
}

// decryptData decrypts data using AES-256-GCM
func (vfs *VirtualFileSystem) decryptData(ciphertext []byte) ([]byte, error) {
	block, err := aes.NewCipher(vfs.encryptionKey)
	if err != nil {
		return nil, err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}

	if len(ciphertext) < gcm.NonceSize() {
		return nil, fmt.Errorf("ciphertext too short")
	}

	nonce, ciphertext := ciphertext[:gcm.NonceSize()], ciphertext[gcm.NonceSize():]
	plaintext, err := gcm.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return nil, fmt.Errorf("decryption failed: %w", err)
	}

	return plaintext, nil
}

// calculateHMAC generates HMAC-SHA512 for tamper detection
func (vfs *VirtualFileSystem) calculateHMAC(data []byte) string {
	h := hmac.New(sha512.New, vfs.hmacKey)
	h.Write(data)
	return hex.EncodeToString(h.Sum(nil))
}

// verifyHMAC verifies data integrity using HMAC
func (vfs *VirtualFileSystem) verifyHMAC(data []byte, expectedHMAC string) bool {
	actualHMAC := vfs.calculateHMAC(data)
	return hmac.Equal([]byte(actualHMAC), []byte(expectedHMAC))
}

// compressData compresses data using gzip
func (vfs *VirtualFileSystem) compressData(data []byte) ([]byte, error) {
	var buf bytes.Buffer
	writer := gzip.NewWriter(&buf)

	if _, err := writer.Write(data); err != nil {
		writer.Close()
		return nil, err
	}

	if err := writer.Close(); err != nil {
		return nil, err
	}

	return buf.Bytes(), nil
}

// decompressData decompresses gzip data
func (vfs *VirtualFileSystem) decompressData(data []byte) ([]byte, error) {
	reader, err := gzip.NewReader(bytes.NewReader(data))
	if err != nil {
		return nil, err
	}
	defer reader.Close()

	return io.ReadAll(reader)
}

// shouldCompress determines if a file should be compressed based on MIME type
func (vfs *VirtualFileSystem) shouldCompress(mimeType string, size int64) bool {
	if !vfs.options.EnableCompression {
		return false
	}

	if size < compressionThreshold {
		return false // Too small to benefit
	}

	// Compress text-based files
	compressibleTypes := []string{
		"text/",
		"application/json",
		"application/xml",
		"application/javascript",
		"application/x-javascript",
		"application/ecmascript",
		"application/rss+xml",
		"application/xhtml+xml",
		"application/svg+xml",
	}

	for _, prefix := range compressibleTypes {
		if strings.HasPrefix(mimeType, prefix) {
			return true
		}
	}

	return false
}

// loadFolder recursively loads files from disk into memory with encryption
func (vfs *VirtualFileSystem) loadFolder(basePath, relativePath string) error {
	fullPath := filepath.Join(basePath, relativePath)

	entries, err := os.ReadDir(fullPath)
	if err != nil {
		return err
	}

	for _, entry := range entries {
		entryPath := filepath.Join(fullPath, entry.Name())
		entryRelPath := filepath.Join(relativePath, entry.Name())

		if entry.IsDir() {
			// Recursively load subdirectories
			if err := vfs.loadFolder(basePath, entryRelPath); err != nil {
				log.Printf("warning: skipping folder %s: %v", entry.Name(), err)
			}
			continue
		}

		// Load file into memory
		info, err := entry.Info()
		if err != nil {
			log.Printf("warning: skipping file %s: %v", entry.Name(), err)
			continue
		}

		// Check file size limit (use configured limit)
		if info.Size() > vfs.options.MaxFileSize {
			log.Printf("warning: skipping file %s: exceeds max size (%d MB)",
				entry.Name(), vfs.options.MaxFileSize/(1024*1024))
			continue
		}

		// Check total size limit (use configured limit)
		if vfs.totalSize+info.Size() > vfs.options.MaxTotalSize {
			log.Printf("warning: stopping file loading: total size limit reached (%d MB)",
				vfs.options.MaxTotalSize/(1024*1024))
			return nil
		}

		// Read file content
		data, err := os.ReadFile(entryPath)
		if err != nil {
			log.Printf("warning: skipping file %s: %v", entry.Name(), err)
			continue
		}

		// Calculate hash of ORIGINAL content for integrity verification
		hash := sha256.Sum256(data)
		hashStr := hex.EncodeToString(hash[:])

		// Calculate HMAC of original content
		hmacStr := vfs.calculateHMAC(data)

		// Detect MIME type before processing
		mimeType := mime.TypeByExtension(filepath.Ext(entry.Name()))
		if mimeType == "" {
			mimeType = "application/octet-stream"
		}

		// Optionally compress before encryption
		dataToEncrypt := data
		isCompressed := false
		if vfs.shouldCompress(mimeType, info.Size()) {
			compressed, err := vfs.compressData(data)
			if err != nil {
				log.Printf("warning: compression failed for %s: %v", entry.Name(), err)
			} else if len(compressed) < len(data) {
				// Only use compression if it actually reduces size
				dataToEncrypt = compressed
				isCompressed = true
				log.Printf("Compressed %s: %d -> %d bytes (%.1f%%)",
					entry.Name(), len(data), len(compressed),
					100.0*float64(len(compressed))/float64(len(data)))
			}
		}

		// Encrypt the data (compressed or original)
		encryptedData, err := vfs.encryptData(dataToEncrypt)
		if err != nil {
			log.Printf("warning: skipping file %s: encryption failed: %v", entry.Name(), err)
			continue
		}

		// Store in VFS with encrypted data
		vfile := &VirtualFile{
			Path:         entryRelPath,
			Name:         entry.Name(),
			Data:         encryptedData, // Store encrypted (possibly compressed)
			Size:         info.Size(),   // Original size
			MimeType:     mimeType,
			Hash:         hashStr,
			HMAC:         hmacStr,
			ModTime:      info.ModTime(),
			CreatedAt:    time.Now(),
			isEncrypted:  true,
			isCompressed: isCompressed,
			Permissions: &acl.ItemPermissions{
				CanRead:   true,
				CanWrite:  false,
				CanDelete: false,
			},
			AccessCount: 0,
		}

		vfs.files[entryRelPath] = vfile
		vfs.totalSize += info.Size()
	}

	return nil
}

// ValidatePath ensures the path is safe and doesn't escape the sandbox
func (vfs *VirtualFileSystem) ValidatePath(path string) error {
	// Check path length to prevent buffer overflow attacks
	if len(path) > maxPathLength {
		return fmt.Errorf("invalid path: exceeds maximum length")
	}

	// Check for null bytes (path injection attack)
	if strings.Contains(path, "\x00") {
		return fmt.Errorf("invalid path: contains null byte")
	}

	// Remove leading slashes first (VFS paths are always relative)
	cleaned := strings.TrimPrefix(path, "/")
	cleaned = strings.TrimPrefix(cleaned, "\\")

	// Normalize path
	cleaned = filepath.Clean(cleaned)

	// Check for path traversal attempts
	if strings.Contains(cleaned, "..") {
		return fmt.Errorf("invalid path: contains '..'")
	}

	// After removing leading slashes, check if it's still absolute (shouldn't be)
	if filepath.IsAbs(cleaned) {
		return fmt.Errorf("invalid path: absolute paths not allowed")
	}

	// Check for suspicious patterns
	suspicious := []string{
		"~", // Home directory expansion
		"$", // Environment variable expansion
		"|", // Shell pipe
		";", // Command separator
		"&", // Background execution
		"`", // Command substitution
		"*", // Wildcard
		"?", // Wildcard
	}
	for _, pattern := range suspicious {
		if strings.Contains(cleaned, pattern) {
			logSecurityIncident("path_injection", "high", "Suspicious path pattern detected", map[string]any{
				"path":    path,
				"pattern": pattern,
				"cleaned": cleaned,
			})
			return fmt.Errorf("invalid path: contains suspicious characters")
		}
	}

	return nil
}

// trackAccess records file access for anomaly detection
func (vfs *VirtualFileSystem) trackAccess(path string, success bool, ipAddr string) {
	vfs.accessMu.Lock()
	defer vfs.accessMu.Unlock()

	record, exists := vfs.accessLog[path]
	if !exists {
		record = &FileAccessRecord{
			Path:        path,
			FirstAccess: time.Now(),
			IPAddresses: make(map[string]int),
		}
		vfs.accessLog[path] = record
	}

	record.LastAccess = time.Now()
	if success {
		record.AccessCount++
	} else {
		record.FailedAttempts++
	}

	if ipAddr != "" {
		record.IPAddresses[ipAddr]++
	}

	// Anomaly detection
	if record.FailedAttempts > 10 {
		logSecurityIncident("excessive_failures", "medium", "Excessive failed access attempts", map[string]any{
			"path":            path,
			"failed_attempts": record.FailedAttempts,
			"ip_addresses":    record.IPAddresses,
		})
		record.SuspiciousFlags = append(record.SuspiciousFlags, "excessive_failures")
	}

	if record.AccessCount > vfs.options.MaxAccessPerFile {
		logSecurityIncident("excessive_access", "medium", "Excessive access to file", map[string]any{
			"path":          path,
			"access_count":  record.AccessCount,
			"limit":         vfs.options.MaxAccessPerFile,
			"ip_addresses": record.IPAddresses,
		})
		record.SuspiciousFlags = append(record.SuspiciousFlags, "excessive_access")
	}

	// Calculate anomaly score
	record.AnomalyScore = vfs.calculateAnomalyScore(record)
	if record.AnomalyScore > float64(vfs.options.AnomalyThreshold) {
		logSecurityIncident("anomaly_detected", "high", "High anomaly score detected", map[string]any{
			"path":              path,
			"anomaly_score":     record.AnomalyScore,
			"threshold":         vfs.options.AnomalyThreshold,
			"suspicious_flags": record.SuspiciousFlags,
			"access_count":      record.AccessCount,
			"failed_attempts":   record.FailedAttempts,
			"unique_ips":        len(record.IPAddresses),
		})
	}
}

// calculateAnomalyScore uses simple ML-inspired heuristics to detect suspicious behavior
func (vfs *VirtualFileSystem) calculateAnomalyScore(record *FileAccessRecord) float64 {
	score := 0.0

	// Factor 1: Failed attempt ratio (0-30 points)
	totalAttempts := record.AccessCount + record.FailedAttempts
	if totalAttempts > 0 {
		failureRate := float64(record.FailedAttempts) / float64(totalAttempts)
		score += failureRate * 30.0
	}

	// Factor 2: Access frequency (0-25 points)
	if !record.FirstAccess.IsZero() {
		duration := time.Since(record.FirstAccess).Seconds()
		if duration > 0 {
			accessRate := float64(record.AccessCount) / duration
			// More than 1 access per second is suspicious
			if accessRate > 1.0 {
				score += math.Min(accessRate*5.0, 25.0)
			}
		}
	}

	// Factor 3: IP diversity (0-20 points)
	uniqueIPs := len(record.IPAddresses)
	if uniqueIPs > 5 {
		// Many IPs accessing same file is suspicious
		score += math.Min(float64(uniqueIPs-5)*2.0, 20.0)
	}

	// Factor 4: Time-based anomaly (0-15 points)
	if !record.LastAccess.IsZero() {
		hourOfDay := record.LastAccess.Hour()
		// Access during unusual hours (1-5 AM) is more suspicious
		if hourOfDay >= 1 && hourOfDay <= 5 {
			score += 15.0
		}
	}

	// Factor 5: Suspicious flags (0-10 points)
	score += float64(len(record.SuspiciousFlags)) * 5.0

	// Cap at 100
	return math.Min(score, 100.0)
}

// checkRateLimit enforces rate limiting per file
func (vfs *VirtualFileSystem) checkRateLimit(path string) error {
	vfs.accessMu.RLock()
	record, exists := vfs.accessLog[path]
	vfs.accessMu.RUnlock()

	if !exists {
		return nil // First access
	}

	timeSinceFirst := time.Since(record.FirstAccess)
	if timeSinceFirst < rateLimitWindow && record.AccessCount > vfs.options.MaxAccessPerFile {
		return fmt.Errorf("rate limit exceeded: too many requests")
	}

	return nil
}

// ReadFile reads and decrypts a file from the VFS with full security checks
func (vfs *VirtualFileSystem) ReadFile(path string) (*VirtualFile, error) {
	return vfs.ReadFileWithIP(path, "")
}

// ReadFileWithIP reads file with IP tracking for anomaly detection
func (vfs *VirtualFileSystem) ReadFileWithIP(path string, ipAddr string) (*VirtualFile, error) {
	// Validate path
	if err := vfs.ValidatePath(path); err != nil {
		vfs.trackAccess(path, false, ipAddr)
		return nil, fmt.Errorf("access denied: %w", err)
	}

	// Check rate limiting
	if err := vfs.checkRateLimit(path); err != nil {
		vfs.trackAccess(path, false, ipAddr)
		vfs.accessMu.RLock()
		record := vfs.accessLog[path]
		vfs.accessMu.RUnlock()
		logSecurityIncident("rate_limit_exceeded", "medium", "Rate limit exceeded", map[string]any{
			"path":         path,
			"ip":           ipAddr,
			"access_count": record.AccessCount,
			"limit":        vfs.options.MaxAccessPerFile,
			"window":       rateLimitWindow.String(),
		})
		return nil, err
	}

	vfs.mu.RLock()

	// Normalize path for lookup
	normalizedPath := filepath.Clean(path)
	normalizedPath = strings.TrimPrefix(normalizedPath, "/")
	normalizedPath = strings.TrimPrefix(normalizedPath, "\\")

	vfile, exists := vfs.files[normalizedPath]
	if !exists {
		vfs.mu.RUnlock()
		vfs.trackAccess(path, false, ipAddr)
		return nil, fmt.Errorf("file not found: %s", path)
	}

	// Check permissions
	if vfile.Permissions != nil && !vfile.Permissions.CanRead {
		vfs.mu.RUnlock()
		vfs.trackAccess(path, false, ipAddr)
		return nil, fmt.Errorf("access denied: no read permission")
	}

	// Decrypt data
	decryptedData, err := vfs.decryptData(vfile.Data)
	if err != nil {
		vfs.mu.RUnlock()
		vfs.trackAccess(path, false, ipAddr)
		logSecurityIncident("tampering", "critical", "Decryption failed - possible tampering", map[string]any{
			"path":  path,
			"error": err.Error(),
			"ip":    ipAddr,
		})
		return nil, fmt.Errorf("data corruption detected")
	}

	// Decompress if needed
	if vfile.isCompressed {
		decompressedData, err := vfs.decompressData(decryptedData)
		if err != nil {
			vfs.mu.RUnlock()
			vfs.trackAccess(path, false, ipAddr)
			logSecurityIncident("data_corruption", "high", "Decompression failed", map[string]any{
				"path":  path,
				"error": err.Error(),
				"ip":    ipAddr,
			})
			return nil, fmt.Errorf("data corruption detected")
		}
		decryptedData = decompressedData
	}

	// Verify HMAC to detect tampering (on original uncompressed data)
	if !vfs.verifyHMAC(decryptedData, vfile.HMAC) {
		vfs.mu.RUnlock()
		vfs.trackAccess(path, false, ipAddr)
		logSecurityIncident("tampering", "critical", "HMAC verification failed - TAMPERING DETECTED", map[string]any{
			"path":          path,
			"ip":            ipAddr,
			"file_hash":     vfile.Hash,
			"stored_hmac":   vfile.HMAC,
		})
		return nil, fmt.Errorf("tampering detected: HMAC verification failed")
	}

	// Verify hash integrity (on original uncompressed data)
	hash := sha256.Sum256(decryptedData)
	hashStr := hex.EncodeToString(hash[:])
	if hashStr != vfile.Hash {
		vfs.mu.RUnlock()
		vfs.trackAccess(path, false, ipAddr)
		logSecurityIncident("tampering", "critical", "Hash mismatch - TAMPERING DETECTED", map[string]any{
			"path":         path,
			"ip":           ipAddr,
			"expected_hash": vfile.Hash,
			"actual_hash":   hashStr,
		})
		return nil, fmt.Errorf("tampering detected: hash mismatch")
	}

	vfs.mu.RUnlock()

	// Track successful access
	vfs.trackAccess(path, true, ipAddr)

	// Return decrypted file data (fully decompressed and verified)
	return &VirtualFile{
		Path:         vfile.Path,
		Name:         vfile.Name,
		Data:        decryptedData, // Return decrypted data
		Size:        vfile.Size,
		MimeType:    vfile.MimeType,
		Hash:        vfile.Hash,
		HMAC:        vfile.HMAC,
		ModTime:     vfile.ModTime,
		Permissions: vfile.Permissions,
		AccessCount: vfile.AccessCount + 1,
		CreatedAt:   vfile.CreatedAt,
		isEncrypted: false, // Now decrypted
	}, nil
}

// SecureCleanup securely wipes encryption keys and sensitive data from memory
func (vfs *VirtualFileSystem) SecureCleanup() {
	vfs.mu.Lock()
	defer vfs.mu.Unlock()

	log.Println("VFS: Performing secure cleanup...")

	// Zero out encryption keys
	for i := range vfs.encryptionKey {
		vfs.encryptionKey[i] = 0
	}
	for i := range vfs.hmacKey {
		vfs.hmacKey[i] = 0
	}

	// Zero out all encrypted file data
	for _, vfile := range vfs.files {
		for i := range vfile.Data {
			vfile.Data[i] = 0
		}
	}

	// Clear maps
	vfs.files = nil
	vfs.accessLog = nil

	runtime.GC() // Force garbage collection

	log.Println("VFS: Secure cleanup completed")
}

// GetSecurityStats returns security statistics for monitoring
func (vfs *VirtualFileSystem) GetSecurityStats() map[string]interface{} {
	vfs.accessMu.RLock()
	defer vfs.accessMu.RUnlock()

	totalAccesses := 0
	totalFailed := 0
	uniqueIPs := make(map[string]bool)

	for _, record := range vfs.accessLog {
		totalAccesses += record.AccessCount
		totalFailed += record.FailedAttempts
		for ip := range record.IPAddresses {
			uniqueIPs[ip] = true
		}
	}

	fileCount, totalSize := vfs.GetStats()

	return map[string]interface{}{
		"files_count":       fileCount,
		"total_size_mb":     float64(totalSize) / (1024 * 1024),
		"encrypted":         true,
		"sealed":            vfs.sealed,
		"total_accesses":    totalAccesses,
		"failed_accesses":   totalFailed,
		"unique_ips":        len(uniqueIPs),
		"uptime_seconds":    time.Since(vfs.createdAt).Seconds(),
		"read_only":         vfs.readOnly,
	}
}

// FileExists checks if a file exists in the VFS
func (vfs *VirtualFileSystem) FileExists(path string) bool {
	if err := vfs.ValidatePath(path); err != nil {
		return false
	}

	vfs.mu.RLock()
	defer vfs.mu.RUnlock()

	normalizedPath := filepath.Clean(path)
	normalizedPath = strings.TrimPrefix(normalizedPath, "/")
	normalizedPath = strings.TrimPrefix(normalizedPath, "\\")

	_, exists := vfs.files[normalizedPath]
	return exists
}

// GetStats returns statistics about the VFS
func (vfs *VirtualFileSystem) GetStats() (fileCount int, totalSize int64) {
	vfs.mu.RLock()
	defer vfs.mu.RUnlock()
	return len(vfs.files), vfs.totalSize
}
