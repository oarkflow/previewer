package file

import (
	"bytes"
	"context"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"io/fs"
	"log"
	"mime"
	"net"
	"net/http"
	"net/url"
	"os"
	"os/exec"
	"os/signal"
	"path/filepath"
	"runtime"
	"strings"
	"sync"
	"time"

	"github.com/oarkflow/previewer/assets"
	"github.com/oarkflow/previewer/pkg/acl"
	"github.com/oarkflow/previewer/pkg/vfs"

	"github.com/gorilla/websocket"
)

// LogCallback is called when a security incident occurs
type LogCallback func(data map[string]any)

var (
	logCallbackMu sync.RWMutex
	logCallback   LogCallback = defaultLogCallback
)

// defaultLogCallback is the default no-op callback
var defaultLogCallback = func(data map[string]any) {
	// Default: do nothing, just log to stdout
	// Users can override with SetLogCallback
}

// SetLogCallback sets a custom callback for security incident logging
func SetLogCallback(fn LogCallback) {
	logCallbackMu.Lock()
	defer logCallbackMu.Unlock()
	if fn != nil {
		logCallback = fn
	} else {
		logCallback = defaultLogCallback
	}
}

// logSecurityIncident logs a security incident via callback
func logSecurityIncident(incidentType, severity, message string, details map[string]any) {
	logCallbackMu.RLock()
	cb := logCallback
	logCallbackMu.RUnlock()

	data := map[string]any{
		"timestamp":     time.Now().Unix(),
		"incident_type": incidentType,
		"severity":      severity, // "low", "medium", "high", "critical"
		"message":       message,
		"details":       details,
	}

	// Call the callback
	cb(data)

	// Also log to stdout
	log.Printf("SECURITY INCIDENT [%s]: %s - %s", severity, incidentType, message)
}

// FolderItem represents a file or folder in the folder structure
type FolderItem struct {
	ID          string            `json:"id"`
	Name        string            `json:"name"`
	Type        string            `json:"type"` // "file" or "folder"
	Size        int64             `json:"size"`
	Extension   string            `json:"extension,omitempty"`
	LastMod     int64             `json:"lastModified,omitempty"` // Unix milliseconds
	Path        string            `json:"path"`
	Children    []*FolderItem     `json:"children,omitempty"`
	MimeType    string            `json:"mimeType,omitempty"`
	IsSecure    bool              `json:"isSecure,omitempty"`
	Permissions *acl.ItemPermissions  `json:"permissions,omitempty"`
}

// FolderMeta represents metadata about the folder
type FolderMeta struct {
	Path         string        `json:"path"`
	Name         string        `json:"name"`
	Items        []*FolderItem `json:"items"`
	TotalSize    int64         `json:"totalSize"`
	TotalFiles   int           `json:"totalFiles"`
	TotalFolders int           `json:"totalFolders"`
	LastMod      int64         `json:"lastModified,omitempty"`
	IsSecure     bool          `json:"isSecure"`
}


// Security configuration structures (same shape as previous implementation)
type securityConfig struct {
	NoCopy              bool             `json:"noCopy"`
	NoDownload          bool             `json:"noDownload"`
	ScreenshotResistant bool             `json:"screenshotResistant"`
	Watermark           bool             `json:"watermark"`
	WatermarkConfig     *watermarkConfig `json:"watermarkConfig,omitempty"`
	SessionTimeout      *int             `json:"sessionTimeout,omitempty"`
	ActivityLogging     bool             `json:"activityLogging"`
}

type watermarkConfig struct {
	Text     string  `json:"text"`
	FontSize int     `json:"fontSize"`
	Opacity  float64 `json:"opacity"`
	Rotation int     `json:"rotation"`
	Color    string  `json:"color"`
	Spacing  int     `json:"spacing"`
}

type previewServer struct {
	filePath       string
	fileName       string
	fileData       []byte
	mimeType       string
	securityConfig securityConfig
	indexHTML      []byte
	cspNonce       string
	upgrader       websocket.Upgrader
	closeCh        chan struct{}
	httpServer     *http.Server
	folderPath     string // For folder preview mode
	folderMeta     *FolderMeta // For folder preview mode
	vfs            *vfs.VirtualFileSystem // Secure in-memory filesystem sandbox
	wsConnections  int // Track active WebSocket connections
}

func PreviewFile(filePath string) error {
	absPath, err := filepath.Abs(filePath)
	if err != nil {
		log.Fatalf("resolve file: %v", err)
	}
	f, err := os.Open(absPath)
	if err != nil {
		log.Fatalf("open file: %v", err)
	}
	defer f.Close()
	return Preview(f)
}

// Preview reads the file from the provided reader and serves the preview UI until the user closes it.
// If the reader implements Name() string (e.g. *os.File), the base name will be used in the UI and URL.
func Preview(r io.Reader) error {
	if r == nil {
		return errors.New("reader is nil")
	}

	data, err := io.ReadAll(r)
	if err != nil {
		return fmt.Errorf("read data: %w", err)
	}

	name := "file"
	if n, ok := r.(interface{ Name() string }); ok {
		if bn := filepath.Base(n.Name()); bn != "" {
			name = bn
		}
	}

	srv, err := newPreviewServerFromBytes(name, data)
	if err != nil {
		return fmt.Errorf("create preview server: %w", err)
	}

	listener, port := pickListener()

	mux := http.NewServeMux()
	mux.HandleFunc("/ws", srv.handleWS)
	mux.Handle("/", srv.spaHandler())

	httpServer := &http.Server{Handler: withLogging(mux)}
	srv.httpServer = httpServer

	go func() {
		log.Printf("serving preview on http://localhost:%d (file: %s)", port, srv.fileName)
		if err := httpServer.Serve(listener); err != nil && err != http.ErrServerClosed {
			log.Fatalf("server error: %v", err)
		}
	}()

	previewURL := fmt.Sprintf("http://localhost:%d/?file=%s", port, url.QueryEscape(srv.fileName))
	if err := openBrowser(previewURL); err != nil {
		log.Printf("open browser: %v", err)
	}

	srv.waitForClose()

	ctx, cancel := context.WithTimeout(context.Background(), vfs.ShutdownTimeout)
	defer cancel()
	_ = httpServer.Shutdown(ctx)
	log.Println("server shutdown")
	return nil
}

func randomNonceBase64(n int) (string, error) {
	b := make([]byte, n)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return base64.RawStdEncoding.EncodeToString(b), nil
}

func newPreviewServerFromBytes(name string, fileData []byte) (*previewServer, error) {
	mimeType := mime.TypeByExtension(strings.ToLower(filepath.Ext(name)))
	if mimeType == "" {
		// fallback to detection from content
		if len(fileData) > 0 {
			mimeType = http.DetectContentType(fileData)
		} else {
			mimeType = "application/octet-stream"
		}
	}

	// Read embedded index.html
	dist, err := fs.Sub(assets.DistFS, "dist")
	if err != nil {
		return nil, fmt.Errorf("embed dist: %w", err)
	}
	indexBytes, err := fs.ReadFile(dist, "index.html")
	if err != nil {
		return nil, fmt.Errorf("read index.html: %w", err)
	}

	// Maximum security configuration for secure preview
	sessionTimeout := 30 * 60 * 1000 // 30 minutes in milliseconds
	secConfig := securityConfig{
		NoCopy:              true,
		NoDownload:          true,
		ScreenshotResistant: true,
		Watermark:           true,
		WatermarkConfig: &watermarkConfig{
			Text:     "CONFIDENTIAL",
			FontSize: 48,
			Opacity:  0.15,
			Rotation: -30,
			Color:    "#888888",
			Spacing:  200,
		},
		SessionTimeout:  &sessionTimeout,
		ActivityLogging: true,
	}

	embeddedFile := map[string]interface{}{
		"name":     name,
		"size":     len(fileData),
		"type":     mimeType,
		"data":     base64.StdEncoding.EncodeToString(fileData),
		"embedded": true,
	}
	fileJSON, err := json.Marshal(embeddedFile)
	if err != nil {
		return nil, fmt.Errorf("marshal file data: %w", err)
	}

	securityJSON, err := json.Marshal(secConfig)
	if err != nil {
		return nil, fmt.Errorf("marshal security config: %w", err)
	}

	nonce, err := randomNonceBase64(16)
	if err != nil {
		return nil, fmt.Errorf("nonce: %w", err)
	}

	injectionScript := fmt.Sprintf(
		`<script nonce="%s">window.__EMBEDDED_FILE__=%s;window.__SECURITY_CONFIG__=%s;</script>`,
		nonce,
		fileJSON,
		securityJSON,
	)
	modifiedIndex := bytes.Replace(indexBytes, []byte("</head>"), []byte(injectionScript+"</head>"), 1)

	return &previewServer{
		filePath:       "",
		fileName:       name,
		fileData:       fileData,
		mimeType:       mimeType,
		securityConfig: secConfig,
		indexHTML:      modifiedIndex,
		cspNonce:       nonce,
		upgrader: websocket.Upgrader{
			ReadBufferSize:  1024,
			WriteBufferSize: 1024,
			CheckOrigin: func(r *http.Request) bool {
				host := strings.ToLower(r.Host)
				return strings.HasPrefix(host, "localhost") || strings.HasPrefix(host, "127.0.0.1")
			},
		},
		closeCh: make(chan struct{}),
	}, nil
}

func (s *previewServer) spaHandler() http.Handler {
	dist, err := fs.Sub(assets.DistFS, "dist")
	if err != nil {
		log.Fatalf("embed dist: %v", err)
	}
	fileServer := http.FileServer(http.FS(dist))

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// WS is handled elsewhere
		if r.URL.Path == "/ws" {
			http.NotFound(w, r)
			return
		}

		if r.URL.Path == "/" {			// Check if this is a file+folder request
			query := r.URL.Query()
			fileParam := query.Get("file")
			folderParam := query.Get("folder")

			if fileParam != "" && folderParam != "" && s.folderPath != "" {
				// User wants to view a specific file from the folder
				html, err := s.generateFilePreviewHTML(fileParam)
				if err != nil {
					http.Error(w, fmt.Sprintf("Failed to generate file preview: %v", err), http.StatusInternalServerError)
					return
				}
				w.Header().Set("Content-Type", "text/html; charset=utf-8")
				w.Header().Set("Cache-Control", "no-store")
				w.WriteHeader(http.StatusOK)
				_, _ = w.Write(html)
				return
			}

			// Normal folder or file preview			w.Header().Set("Content-Type", "text/html; charset=utf-8")
			w.Header().Set("Cache-Control", "no-store")
			w.WriteHeader(http.StatusOK)
			_, _ = w.Write(s.indexHTML)
			return
		}

		path := strings.TrimPrefix(r.URL.Path, "/")
		if path == "" {
			path = "index.html"
		}

		if f, err := dist.Open(path); err == nil {
			_ = f.Close()
			w.Header().Set("Cache-Control", "no-store")
			r2 := r.Clone(r.Context())
			r2.URL.Path = "/" + path
			fileServer.ServeHTTP(w, r2)
			return
		}

		// SPA fallback: serve modified index.html
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		w.Header().Set("Cache-Control", "no-store")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write(s.indexHTML)
	})
}

func (s *previewServer) handleWS(w http.ResponseWriter, r *http.Request) {
	conn, err := s.upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("ws upgrade: %v", err)
		return
	}

	// Increment connection counter
	s.wsConnections++
	log.Printf("WebSocket connected (total connections: %d)", s.wsConnections)

	defer func() {
		conn.Close()
		s.wsConnections--
		log.Printf("WebSocket closed (remaining connections: %d)", s.wsConnections)

		// Only shut down when ALL connections are closed
		if s.wsConnections == 0 {
			log.Println("All WebSocket connections closed, shutting down server")
			s.signalClose()
		} else {
			log.Printf("Keeping server alive (%d connections still active)", s.wsConnections)
		}
	}()

	for {
		mt, msg, err := conn.ReadMessage()
		if err != nil {
			break
		}
		if mt != websocket.TextMessage {
			continue
		}
		m := strings.ToLower(strings.TrimSpace(string(msg)))
		if m == "ping" {
			continue
		}
		if m == "close" || m == "closing" {
			return
		}
		if strings.HasPrefix(m, "violation") || strings.Contains(m, "security_violation") {
			log.Printf("security violation reported by client: %s", m)
			return
		}
	}
}

func (s *previewServer) waitForClose() {
	sigCh := make(chan os.Signal, 1)
	signalNotify(sigCh)
	select {
	case <-s.closeCh:
	case <-sigCh:
	}
}

// signalNotify is a small wrapper to allow easier unit testing of signal handling.
func signalNotify(ch chan os.Signal) {
	signal.Notify(ch, os.Interrupt)
}

func (s *previewServer) signalClose() {
	select {
	case s.closeCh <- struct{}{}:
	default:
	}
}

func pickListener() (net.Listener, int) {
	l, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		log.Fatalf("listen: %v", err)
	}
	addr := l.Addr().(*net.TCPAddr)
	return l, addr.Port
}

func openBrowser(url string) error {
	var cmd string
	var args []string

	switch runtime.GOOS {
	case "darwin":
		cmd = "open"
		args = []string{url}
	case "windows":
		cmd = "rundll32"
		args = []string{"url.dll,FileProtocolHandler", url}
	default:
		cmd = "xdg-open"
		args = []string{url}
	}

	return execCommand(cmd, args...)
}

func execCommand(cmd string, args ...string) error {
	c := exec.Command(cmd, args...)
	return c.Start()
}

func withLogging(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		next.ServeHTTP(w, r)
		log.Printf("%s %s (%s)", r.Method, r.URL.Path, time.Since(start).Round(time.Millisecond))
	})
}

// PreviewFolder serves a folder structure for preview in the browser
func PreviewFolder(folderPath string) error {
	return PreviewFolderWithOptions(folderPath, vfs.DefaultOptions())
}

// PreviewFolderWithOptions opens a folder preview with custom VFS options
func PreviewFolderWithOptions(folderPath string, options vfs.Options) error {
	absPath, err := filepath.Abs(folderPath)
	if err != nil {
		return fmt.Errorf("resolve folder path: %w", err)
	}

	// Check if path exists and is a directory
	info, err := os.Stat(absPath)
	if err != nil {
		return fmt.Errorf("stat folder: %w", err)
	}
	if !info.IsDir() {
		return fmt.Errorf("path is not a directory: %s", absPath)
	}

	// Initialize secure in-memory VFS sandbox with options
	log.Println("Loading folder into secure VFS sandbox...")
	log.Printf("VFS Options: MaxFile=%dMB, MaxTotal=%dMB, Compress=%v, RateLimit=%d/min, AnomalyThreshold=%d, MLock=%v",
		options.MaxFileSize/(1024*1024), options.MaxTotalSize/(1024*1024),
		options.EnableCompression, options.MaxAccessPerFile, options.AnomalyThreshold, options.MLockMemory)

	fs, err := vfs.NewVirtualFileSystemWithOptions(absPath, options)
	if err != nil {
		return fmt.Errorf("create VFS: %w", err)
	}

	// Set up VFS callback to capture security incidents
	vfs.SetLogCallback(func(data map[string]any) {
		// Forward to default logger
		logSecurityIncident(
			data["incident_type"].(string),
			data["severity"].(string),
			data["message"].(string),
			data["details"].(map[string]any),
		)
	})

	fileCount, totalSize := fs.GetStats()
	log.Printf("VFS loaded: %d files, %.2f MB", fileCount, float64(totalSize)/(1024*1024))

	// Build folder structure
	folderMeta, err := buildFolderStructure(absPath, "/", 0)
	if err != nil {
		return fmt.Errorf("build folder structure: %w", err)
	}

	// Create a preview server for the folder
	srv, err := newPreviewServerFromFolder(folderMeta)
	if err != nil {
		return fmt.Errorf("create folder preview server: %w", err)
	}
	srv.folderPath = absPath
	srv.folderMeta = folderMeta
	srv.vfs = fs // Attach VFS to server

	listener, port := pickListener()

	mux := http.NewServeMux()
	mux.HandleFunc("/ws", srv.handleWS)
	mux.HandleFunc("/api/file", srv.handleFileFromFolder)
	mux.HandleFunc("/api/security-incident", srv.handleSecurityIncident)
	mux.Handle("/", srv.spaHandler())

	httpServer := &http.Server{Handler: withLogging(mux)}
	srv.httpServer = httpServer

	go func() {
		log.Printf("serving folder preview on http://localhost:%d (folder: %s)", port, folderMeta.Name)
		if err := httpServer.Serve(listener); err != nil && err != http.ErrServerClosed {
			log.Fatalf("server error: %v", err)
		}
	}()

	previewURL := fmt.Sprintf("http://localhost:%d/?folder=%s", port, url.QueryEscape(folderMeta.Name))
	if err := openBrowser(previewURL); err != nil {
		log.Printf("open browser: %v", err)
	}

	srv.waitForClose()

	// Print security statistics before shutdown
	stats := fs.GetSecurityStats()
	log.Printf("VFS Security Stats: %+v", stats)

	// Perform secure cleanup
	defer fs.SecureCleanup()

	ctx, cancel := context.WithTimeout(context.Background(), vfs.ShutdownTimeout)
	defer cancel()
	_ = httpServer.Shutdown(ctx)
	log.Println("server shutdown")
	return nil
}

// buildFolderStructure recursively builds the folder structure
func buildFolderStructure(basePath, relativePath string, depth int) (*FolderMeta, error) {
	const maxDepth = 10 // Prevent infinite recursion
	if depth > maxDepth {
		return nil, fmt.Errorf("max folder depth exceeded")
	}

	fullPath := filepath.Join(basePath)
	entries, err := os.ReadDir(fullPath)
	if err != nil {
		return nil, fmt.Errorf("read directory: %w", err)
	}

	var items []*FolderItem
	var totalSize int64
	var totalFiles, totalFolders int
	itemID := 0

	for _, entry := range entries {
		// Skip hidden files and folders
		if strings.HasPrefix(entry.Name(), ".") {
			continue
		}

		entryPath := filepath.Join(fullPath, entry.Name())
		entryRelPath := filepath.Join(relativePath, entry.Name())

		info, err := entry.Info()
		if err != nil {
			log.Printf("warning: skipping %s: %v", entry.Name(), err)
			continue
		}

		itemID++
		item := &FolderItem{
			ID:       fmt.Sprintf("item-%d-%d", depth, itemID),
			Name:     entry.Name(),
			Path:     entryRelPath,
			LastMod:  info.ModTime().UnixMilli(),
			IsSecure: false, // Can be customized based on folder permissions
			Permissions: &acl.ItemPermissions{
				CanRead:   true,
				CanWrite:  false,
				CanDelete: false,
			},
		}

		if entry.IsDir() {
			item.Type = "folder"
			item.Size = 0
			totalFolders++

			// Recursively build children
			childMeta, err := buildFolderStructure(entryPath, entryRelPath, depth+1)
			if err != nil {
				log.Printf("warning: skipping folder %s: %v", entry.Name(), err)
				continue
			}

			item.Children = childMeta.Items
			totalSize += childMeta.TotalSize
			totalFiles += childMeta.TotalFiles
			totalFolders += childMeta.TotalFolders
		} else {
			item.Type = "file"
			item.Size = info.Size()
			item.Extension = strings.TrimPrefix(filepath.Ext(entry.Name()), ".")
			item.MimeType = mime.TypeByExtension(filepath.Ext(entry.Name()))
			if item.MimeType == "" {
				item.MimeType = "application/octet-stream"
			}
			totalSize += info.Size()
			totalFiles++
		}

		items = append(items, item)
	}

	folderName := filepath.Base(basePath)
	if relativePath == "/" {
		folderName = filepath.Base(basePath)
	}

	return &FolderMeta{
		Path:         relativePath,
		Name:         folderName,
		Items:        items,
		TotalSize:    totalSize,
		TotalFiles:   totalFiles,
		TotalFolders: totalFolders,
		IsSecure:     true, // Mark as secure by default
	}, nil
}

// newPreviewServerFromFolder creates a preview server for a folder structure
func newPreviewServerFromFolder(folderMeta *FolderMeta) (*previewServer, error) {
	// Read embedded index.html
	dist, err := fs.Sub(assets.DistFS, "dist")
	if err != nil {
		return nil, fmt.Errorf("embed dist: %w", err)
	}
	indexBytes, err := fs.ReadFile(dist, "index.html")
	if err != nil {
		return nil, fmt.Errorf("read index.html: %w", err)
	}

	// Security configuration for folder preview (no watermark for folder view)
	sessionTimeout := 30 * 60 * 1000 // 30 minutes in milliseconds
	secConfig := securityConfig{
		NoCopy:              false, // Allow copy in folder view
		NoDownload:          false, // Allow downloads from folder view
		ScreenshotResistant: false, // No screenshot blocking for folder view
		Watermark:           false, // No watermark for folder view itself
		SessionTimeout:      &sessionTimeout,
		ActivityLogging:     true,
	}

	// Create folder metadata for embedding
	embeddedFolder := map[string]interface{}{
		"name":       folderMeta.Name,
		"size":       folderMeta.TotalSize,
		"type":       "folder",
		"extension":  "",
		"isFolder":   true,
		"folderData": folderMeta,
		"embedded":   true,
	}

	folderJSON, err := json.Marshal(embeddedFolder)
	if err != nil {
		return nil, fmt.Errorf("marshal folder data: %w", err)
	}

	securityJSON, err := json.Marshal(secConfig)
	if err != nil {
		return nil, fmt.Errorf("marshal security config: %w", err)
	}

	nonce, err := randomNonceBase64(16)
	if err != nil {
		return nil, fmt.Errorf("nonce: %w", err)
	}

	injectionScript := fmt.Sprintf(
		`<script nonce="%s">window.__EMBEDDED_FILE__=%s;window.__SECURITY_CONFIG__=%s;</script>`,
		nonce,
		folderJSON,
		securityJSON,
	)
	modifiedIndex := bytes.Replace(indexBytes, []byte("</head>"), []byte(injectionScript+"</head>"), 1)

	return &previewServer{
		filePath:       "",
		fileName:       folderMeta.Name,
		fileData:       []byte{}, // No file data for folders
		mimeType:       "folder",
		securityConfig: secConfig,
		indexHTML:      modifiedIndex,
		cspNonce:       nonce,
		upgrader: websocket.Upgrader{
			ReadBufferSize:  1024,
			WriteBufferSize: 1024,
			CheckOrigin: func(r *http.Request) bool {
				host := strings.ToLower(r.Host)
				return strings.HasPrefix(host, "localhost") || strings.HasPrefix(host, "127.0.0.1")
			},
		},
		closeCh: make(chan struct{}),
	}, nil
}
// handleFileFromFolder serves a specific file from the folder structure using VFS
func (s *previewServer) handleFileFromFolder(w http.ResponseWriter, r *http.Request) {
	if s.vfs == nil {
		http.Error(w, "Not in folder preview mode", http.StatusBadRequest)
		return
	}

	filePath := r.URL.Query().Get("path")
	if filePath == "" {
		http.Error(w, "Missing file path", http.StatusBadRequest)
		return
	}

	// Extract client IP for tracking
	clientIP := r.RemoteAddr
	if forwarded := r.Header.Get("X-Forwarded-For"); forwarded != "" {
		clientIP = forwarded
	}

	// Read file from secure VFS with IP tracking
	vfile, err := s.vfs.ReadFileWithIP(filePath, clientIP)
	if err != nil {
		log.Printf("VFS read error for %s from %s: %v", filePath, clientIP, err)
		http.Error(w, "Access denied or file not found", http.StatusForbidden)
		return
	}

	// Log access for security audit
	log.Printf("VFS: serving file %s (size: %d bytes, hash: %s) to %s",
		vfile.Path, vfile.Size, vfile.Hash[:8], clientIP)

	w.Header().Set("Content-Type", vfile.MimeType)
	w.Header().Set("Content-Length", fmt.Sprintf("%d", vfile.Size))
	w.Header().Set("X-File-Hash", vfile.Hash) // Integrity verification
	w.Header().Set("X-File-HMAC", vfile.HMAC[:16]) // Partial HMAC for verification
	w.Header().Set("Cache-Control", "no-store, no-cache, must-revalidate") // Security: no caching
	w.Header().Set("Pragma", "no-cache") // HTTP/1.0 compatibility
	w.Header().Set("Expires", "0") // Proxies
	w.Write(vfile.Data)
}

// handleSecurityIncident receives security incident reports from the frontend
func (s *previewServer) handleSecurityIncident(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var incident map[string]any
	if err := json.NewDecoder(r.Body).Decode(&incident); err != nil {
		log.Printf("Failed to decode security incident: %v", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Extract incident details
	incidentType, _ := incident["incident_type"].(string)
	severity, _ := incident["severity"].(string)
	message, _ := incident["message"].(string)
	details, _ := incident["details"].(map[string]any)

	// Log the incident
	log.Printf("[SECURITY INCIDENT FROM FRONTEND] Type: %s, Severity: %s, Message: %s",
		incidentType, severity, message)

	// Forward to the callback system
	logSecurityIncident(incidentType, severity, message, details)

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"logged":  true,
	})
}

// generateFilePreviewHTML generates HTML for previewing a specific file from the folder using VFS
func (s *previewServer) generateFilePreviewHTML(filePath string) ([]byte, error) {
	if s.vfs == nil {
		return nil, fmt.Errorf("VFS not initialized")
	}

	// Read file from secure VFS (includes path validation and access control)
	vfile, err := s.vfs.ReadFile(filePath)
	if err != nil {
		return nil, fmt.Errorf("VFS read error: %w", err)
	}

	// Log access for security audit
	log.Printf("VFS: generating preview for %s (size: %d bytes, hash: %s)",
		vfile.Path, vfile.Size, vfile.Hash[:8])

	// Encode file data as base64
	encodedData := base64.StdEncoding.EncodeToString(vfile.Data)

	// Get embedded index.html
	dist, err := fs.Sub(assets.DistFS, "dist")
	if err != nil {
		return nil, fmt.Errorf("embed dist: %w", err)
	}
	indexBytes, err := fs.ReadFile(dist, "index.html")
	if err != nil {
		return nil, fmt.Errorf("read index.html: %w", err)
	}

	// Security configuration for file preview with max security
	sessionTimeout := 30 * 60 * 1000 // 30 minutes in milliseconds
	secConfig := securityConfig{
		NoCopy:              true,
		NoDownload:          true,
		ScreenshotResistant: true,
		Watermark:           true,
		WatermarkConfig: &watermarkConfig{
			Text:     "CONFIDENTIAL",
			FontSize: 48,
			Opacity:  0.1,
			Rotation: -45,
			Color:    "#000000",
			Spacing:  200,
		},
		SessionTimeout:  &sessionTimeout,
		ActivityLogging: true,
	}

	// Create file metadata for embedding
	embeddedFile := map[string]interface{}{
		"name":      vfile.Name,
		"size":      vfile.Size,
		"type":      vfile.MimeType,
		"extension": strings.TrimPrefix(filepath.Ext(vfile.Name), "."),
		"data":      encodedData,
		"embedded":  true,
		"isFolder":  false,
		"hash":      vfile.Hash, // Include hash for integrity verification
	}

	fileJSON, err := json.Marshal(embeddedFile)
	if err != nil {
		return nil, fmt.Errorf("marshal file data: %w", err)
	}

	securityJSON, err := json.Marshal(secConfig)
	if err != nil {
		return nil, fmt.Errorf("marshal security config: %w", err)
	}

	nonce, err := randomNonceBase64(16)
	if err != nil {
		return nil, fmt.Errorf("nonce: %w", err)
	}

	injectionScript := fmt.Sprintf(
		`<script nonce="%s">window.__EMBEDDED_FILE__=%s;window.__SECURITY_CONFIG__=%s;</script>`,
		nonce,
		fileJSON,
		securityJSON,
	)
	modifiedIndex := bytes.Replace(indexBytes, []byte("</head>"), []byte(injectionScript+"</head>"), 1)

	return modifiedIndex, nil
}
