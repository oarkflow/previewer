interface SessionValidationConfig {
    /** Session ID to validate */
    sessionId: string;
    /** Device fingerprint for validation */
    fingerprint: string;
    /** File ID being viewed */
    fileId: string;
    /** Validation interval in milliseconds (default: 30 seconds) */
    intervalMs?: number;
    /** API base URL for backend */
    apiBaseUrl?: string;
    /** Callback when session becomes invalid */
    onSessionInvalid?: (reason: string) => void;
    /** Callback for session events */
    onSessionEvent?: (event: SessionEvent) => void;
    /** Whether validation is enabled */
    enabled?: boolean;
}
interface SessionEvent {
    type: 'validated' | 'expired' | 'revoked' | 'fingerprint_mismatch' | 'error';
    timestamp: number;
    details?: string;
}
interface ValidationResult {
    valid: boolean;
    expiresAt?: number;
    reason?: string;
}
/**
 * Hook to periodically validate session with backend
 * Detects session hijacking, expiry, and revocation
 */
export declare function useSessionValidation({ sessionId, fingerprint, fileId, intervalMs, apiBaseUrl, onSessionInvalid, onSessionEvent, enabled, }: SessionValidationConfig): {
    isValid: boolean;
    lastValidation: Date;
    expiresAt: Date;
    validationCount: number;
    forceValidation: () => Promise<ValidationResult>;
    getEvents: () => SessionEvent[];
};
/**
 * Generate HMAC signature for request authentication
 * In production, this would use a shared secret with the backend
 */
export declare function generateSignature(data: string, secret: string): Promise<string>;
export {};
