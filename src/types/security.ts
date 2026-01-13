/**
 * Security Configuration Types
 * These types define the security settings for the file previewer
 * and the API contract for backend integration
 */

export interface SecurityConfig {
  /** Prevent text selection and copying */
  noCopy: boolean;
  /** Hide download button and prevent file saving */
  noDownload: boolean;
  /** Enable screenshot prevention measures */
  screenshotResistant: boolean;
  /** Enable dynamic watermarking */
  watermark: boolean;
  /** Watermark configuration */
  watermarkConfig?: WatermarkConfig;
  /** Session timeout in milliseconds */
  sessionTimeout?: number;
  /** Enable activity logging */
  activityLogging: boolean;
}

export interface WatermarkConfig {
  /** Text to display as watermark */
  text: string;
  /** Font size in pixels */
  fontSize: number;
  /** Opacity (0-1) */
  opacity: number;
  /** Rotation angle in degrees */
  rotation: number;
  /** Color in hex or rgb */
  color: string;
  /** Spacing between watermark instances */
  spacing: number;
}

export interface SecurityEvent {
  type: SecurityEventType;
  timestamp: number;
  fileId: string;
  userId?: string;
  sessionId: string;
  metadata?: Record<string, unknown>;
}

export type SecurityEventType =
  | 'file_opened'
  | 'file_closed'
  | 'copy_attempt'
  | 'screenshot_attempt'
  | 'print_attempt'
  | 'download_attempt'
  | 'context_menu_blocked'
  | 'dev_tools_detected'
  | 'visibility_changed'
  | 'session_expired';

/**
 * ===========================================
 * GOLANG BACKEND API CONTRACT
 * ===========================================
 * 
 * The following interfaces define the expected API contract
 * for integration with a Golang backend using GIO.
 */

/**
 * Request to fetch a secure file for preview
 * POST /api/v1/files/secure-preview
 */
export interface SecureFileRequest {
  fileId: string;
  sessionToken: string;
  deviceFingerprint: string;
}

/**
 * Response containing encrypted file data and security config
 */
export interface SecureFileResponse {
  /** Encrypted file data (base64) or signed URL */
  data: string;
  /** File metadata */
  metadata: FileMetadata;
  /** Security configuration for this file */
  security: SecurityConfig;
  /** Session ID for tracking */
  sessionId: string;
  /** Token expiry timestamp */
  expiresAt: number;
  /** HMAC signature for verification */
  signature: string;
}

export interface FileMetadata {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  extension: string;
  createdAt: number;
  ownerId: string;
}

/**
 * Log security events to the backend
 * POST /api/v1/files/security-events
 */
export interface SecurityEventLogRequest {
  events: SecurityEvent[];
  sessionId: string;
  signature: string;
}

/**
 * Verify if a session is still valid
 * POST /api/v1/files/verify-session
 */
export interface VerifySessionRequest {
  sessionId: string;
  fileId: string;
  deviceFingerprint: string;
}

export interface VerifySessionResponse {
  valid: boolean;
  expiresAt?: number;
  reason?: string;
}

/**
 * Default security configuration
 */
export const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  noCopy: false,
  noDownload: false,
  screenshotResistant: false,
  watermark: false,
  activityLogging: false,
};

/**
 * Maximum security configuration
 */
export const MAX_SECURITY_CONFIG: SecurityConfig = {
  noCopy: true,
  noDownload: true,
  screenshotResistant: true,
  watermark: true,
  watermarkConfig: {
    text: 'CONFIDENTIAL',
    fontSize: 48,
    opacity: 0.15,
    rotation: -30,
    color: '#888888',
    spacing: 200,
  },
  sessionTimeout: 30 * 60 * 1000, // 30 minutes
  activityLogging: true,
};
