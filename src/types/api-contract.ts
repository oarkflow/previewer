/**
 * =====================================================
 * GOLANG BACKEND API CONTRACT
 * =====================================================
 * 
 * This file defines the complete API contract for integrating
 * the secure file previewer with a Golang backend using GIO.
 * 
 * Implementation Notes for Golang:
 * - Use gin-gonic/gin or similar for HTTP routing
 * - Use crypto/hmac for signature verification
 * - Use github.com/google/uuid for session IDs
 * - Store sessions in Redis or similar for distributed systems
 */

// =====================================================
// AUTHENTICATION & SESSION MANAGEMENT
// =====================================================

/**
 * POST /api/v1/auth/create-session
 * Create a new viewing session for a file
 * 
 * Golang Handler Example:
 * ```go
 * func CreateSession(c *gin.Context) {
 *     var req CreateSessionRequest
 *     if err := c.ShouldBindJSON(&req); err != nil {
 *         c.JSON(400, gin.H{"error": err.Error()})
 *         return
 *     }
 *     
 *     session := &Session{
 *         ID:                uuid.New().String(),
 *         FileID:            req.FileID,
 *         UserID:            getUserID(c),
 *         DeviceFingerprint: req.DeviceFingerprint,
 *         CreatedAt:         time.Now(),
 *         ExpiresAt:         time.Now().Add(30 * time.Minute),
 *         SecurityConfig:    getSecurityConfigForFile(req.FileID),
 *     }
 *     
 *     signature := generateHMAC(session.ID, secretKey)
 *     
 *     c.JSON(200, CreateSessionResponse{
 *         SessionID:      session.ID,
 *         ExpiresAt:      session.ExpiresAt.Unix(),
 *         Signature:      signature,
 *         SecurityConfig: session.SecurityConfig,
 *     })
 * }
 * ```
 */
export interface CreateSessionRequest {
  fileId: string;
  deviceFingerprint: string;
}

export interface CreateSessionResponse {
  sessionId: string;
  expiresAt: number;
  signature: string;
  securityConfig: SecurityConfigDTO;
}

// =====================================================
// FILE RETRIEVAL
// =====================================================

/**
 * POST /api/v1/files/secure-content
 * Retrieve encrypted/secured file content
 * 
 * The response should include:
 * - File content (base64 encoded or as a signed URL)
 * - Watermark configuration specific to this user/session
 * - Expiry information
 * 
 * Golang Handler Example:
 * ```go
 * func GetSecureContent(c *gin.Context) {
 *     var req SecureContentRequest
 *     if err := c.ShouldBindJSON(&req); err != nil {
 *         c.JSON(400, gin.H{"error": err.Error()})
 *         return
 *     }
 *     
 *     // Verify session
 *     session, err := validateSession(req.SessionID, req.Signature)
 *     if err != nil {
 *         c.JSON(401, gin.H{"error": "Invalid session"})
 *         return
 *     }
 *     
 *     // Get file content
 *     file, err := getFile(session.FileID)
 *     if err != nil {
 *         c.JSON(404, gin.H{"error": "File not found"})
 *         return
 *     }
 *     
 *     // Generate signed URL or encode content
 *     contentURL := generateSignedURL(file.Path, 5*time.Minute)
 *     
 *     // Customize watermark with user info
 *     watermark := WatermarkConfig{
 *         Text:     fmt.Sprintf("%s - %s", session.UserEmail, time.Now().Format("2006-01-02")),
 *         FontSize: 48,
 *         Opacity:  0.15,
 *         Rotation: -30,
 *     }
 *     
 *     c.JSON(200, SecureContentResponse{
 *         ContentURL:      contentURL,
 *         Metadata:        fileToMetadata(file),
 *         WatermarkConfig: watermark,
 *         ExpiresAt:       session.ExpiresAt.Unix(),
 *     })
 * }
 * ```
 */
export interface SecureContentRequest {
  sessionId: string;
  signature: string;
}

export interface SecureContentResponse {
  /** Signed URL or base64 content */
  contentUrl: string;
  metadata: FileMetadataDTO;
  watermarkConfig: WatermarkConfigDTO;
  expiresAt: number;
}

// =====================================================
// SECURITY EVENT LOGGING
// =====================================================

/**
 * POST /api/v1/files/log-events
 * Log security events from the client
 * 
 * Events to log:
 * - file_opened, file_closed
 * - copy_attempt (blocked)
 * - screenshot_attempt (detected)
 * - print_attempt (blocked)
 * - download_attempt (blocked)
 * - dev_tools_detected
 * - visibility_changed
 * - session_expired
 * 
 * Golang Handler Example:
 * ```go
 * func LogSecurityEvents(c *gin.Context) {
 *     var req LogEventsRequest
 *     if err := c.ShouldBindJSON(&req); err != nil {
 *         c.JSON(400, gin.H{"error": err.Error()})
 *         return
 *     }
 *     
 *     // Verify session
 *     session, err := validateSession(req.SessionID, req.Signature)
 *     if err != nil {
 *         c.JSON(401, gin.H{"error": "Invalid session"})
 *         return
 *     }
 *     
 *     // Store events in database/analytics
 *     for _, event := range req.Events {
 *         logEvent := &SecurityLog{
 *             SessionID:  session.ID,
 *             UserID:     session.UserID,
 *             FileID:     session.FileID,
 *             EventType:  event.Type,
 *             Timestamp:  time.Unix(event.Timestamp/1000, 0),
 *             Metadata:   event.Metadata,
 *             IPAddress:  c.ClientIP(),
 *             UserAgent:  c.GetHeader("User-Agent"),
 *         }
 *         
 *         // Alert on suspicious activity
 *         if isSuspicious(event.Type) {
 *             alertSecurityTeam(logEvent)
 *         }
 *         
 *         db.Create(logEvent)
 *     }
 *     
 *     c.JSON(200, gin.H{"logged": len(req.Events)})
 * }
 * ```
 */
export interface LogEventsRequest {
  sessionId: string;
  signature: string;
  events: SecurityEventDTO[];
}

export interface SecurityEventDTO {
  type: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

// =====================================================
// SESSION VALIDATION
// =====================================================

/**
 * POST /api/v1/auth/validate-session
 * Validate that a session is still active
 * 
 * Call this periodically from the client to ensure
 * the session hasn't been revoked or expired.
 */
export interface ValidateSessionRequest {
  sessionId: string;
  signature: string;
  deviceFingerprint: string;
}

export interface ValidateSessionResponse {
  valid: boolean;
  expiresAt?: number;
  reason?: 'expired' | 'revoked' | 'fingerprint_mismatch' | 'not_found';
}

// =====================================================
// FILE SECURITY CONFIGURATION
// =====================================================

/**
 * GET /api/v1/files/:fileId/security-config
 * Get the security configuration for a specific file
 * 
 * This allows per-file security settings stored in the database.
 */
export interface SecurityConfigDTO {
  noCopy: boolean;
  noDownload: boolean;
  screenshotResistant: boolean;
  watermark: boolean;
  sessionTimeoutMs: number;
  activityLogging: boolean;
  allowedDomains?: string[];
  maxConcurrentSessions?: number;
}

export interface WatermarkConfigDTO {
  text: string;
  fontSize: number;
  opacity: number;
  rotation: number;
  color: string;
  spacing: number;
  /** Include user-specific info */
  includeUserId: boolean;
  includeTimestamp: boolean;
  includeIpAddress: boolean;
}

export interface FileMetadataDTO {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  extension: string;
  createdAt: number;
  ownerId: string;
  securityLevel: 'public' | 'internal' | 'confidential' | 'restricted';
}

// =====================================================
// GOLANG GIO INTEGRATION
// =====================================================

/**
 * GIO (Gio UI) Integration Notes:
 * 
 * For a native desktop viewer using Gio, consider:
 * 
 * 1. Session Management:
 *    - Store session token securely in OS keychain
 *    - Validate on each file access
 * 
 * 2. Screenshot Prevention:
 *    - Use platform-specific APIs:
 *      - Windows: SetWindowDisplayAffinity(WDA_EXCLUDEFROMCAPTURE)
 *      - macOS: NSWindow.sharingType = .none
 *      - Linux: Limited support, consider overlay approach
 * 
 * 3. File Decryption:
 *    - Decrypt file content in-memory only
 *    - Never write decrypted content to disk
 *    - Clear memory immediately after use
 * 
 * 4. Watermarking:
 *    - Render watermark as overlay in the viewport
 *    - Include user/session info in watermark
 * 
 * Example Gio code structure:
 * ```go
 * package main
 * 
 * import (
 *     "gioui.org/app"
 *     "gioui.org/layout"
 *     "gioui.org/op"
 * )
 * 
 * type SecureViewer struct {
 *     session     *Session
 *     fileContent []byte
 *     watermark   *WatermarkConfig
 * }
 * 
 * func (v *SecureViewer) Layout(gtx layout.Context) layout.Dimensions {
 *     // Render file content
 *     // Overlay watermark
 *     // Handle user interactions
 * }
 * 
 * func main() {
 *     go func() {
 *         w := new(app.Window)
 *         // Set screenshot prevention flags
 *         w.Option(app.Title("Secure Viewer"))
 *         
 *         viewer := &SecureViewer{}
 *         
 *         for e := range w.Events() {
 *             switch e := e.(type) {
 *             case app.FrameEvent:
 *                 gtx := app.NewContext(&ops, e)
 *                 viewer.Layout(gtx)
 *                 e.Frame(gtx.Ops)
 *             }
 *         }
 *     }()
 *     app.Main()
 * }
 * ```
 */

// =====================================================
// CLIENT-SIDE API SERVICE
// =====================================================

/**
 * Example client-side service for backend integration
 */
export interface SecurePreviewerAPI {
  createSession(fileId: string, deviceFingerprint: string): Promise<CreateSessionResponse>;
  getSecureContent(sessionId: string, signature: string): Promise<SecureContentResponse>;
  logEvents(sessionId: string, signature: string, events: SecurityEventDTO[]): Promise<void>;
  validateSession(sessionId: string, signature: string, fingerprint: string): Promise<ValidateSessionResponse>;
}

/**
 * Device fingerprinting function (implement on client)
 * 
 * Collect non-PII device characteristics:
 * - Screen resolution
 * - Timezone
 * - Browser/platform info
 * - Canvas fingerprint
 * - WebGL renderer
 * 
 * Hash these values to create a stable fingerprint
 */
export type DeviceFingerprintFn = () => Promise<string>;
