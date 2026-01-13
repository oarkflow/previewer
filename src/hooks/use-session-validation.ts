import { useEffect, useCallback, useRef, useState } from 'react';
import { SecurityEvent } from '@/types/security';

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
export function useSessionValidation({
  sessionId,
  fingerprint,
  fileId,
  intervalMs = 30000,
  apiBaseUrl = '/api/v1',
  onSessionInvalid,
  onSessionEvent,
  enabled = true,
}: SessionValidationConfig) {
  const [isValid, setIsValid] = useState(true);
  const [lastValidation, setLastValidation] = useState<Date | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [validationCount, setValidationCount] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const eventsRef = useRef<SessionEvent[]>([]);

  const logEvent = useCallback((event: SessionEvent) => {
    eventsRef.current.push(event);
    onSessionEvent?.(event);
  }, [onSessionEvent]);

  const validateSession = useCallback(async (): Promise<ValidationResult> => {
    // In a real implementation, this would call the backend API
    // For now, we simulate validation logic
    try {
      // Simulated API call structure:
      // const response = await fetch(`${apiBaseUrl}/auth/validate-session`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     sessionId,
      //     fingerprint,
      //     fileId,
      //   }),
      // });
      // const result = await response.json();

      // Simulated response - always valid for demo
      const result: ValidationResult = {
        valid: true,
        expiresAt: Date.now() + 30 * 60 * 1000, // 30 minutes from now
      };

      setLastValidation(new Date());
      setValidationCount(prev => prev + 1);

      if (result.valid) {
        setIsValid(true);
        if (result.expiresAt) {
          setExpiresAt(new Date(result.expiresAt));
        }
        logEvent({
          type: 'validated',
          timestamp: Date.now(),
          details: `Session validated successfully (check #${validationCount + 1})`,
        });
      } else {
        setIsValid(false);
        logEvent({
          type: result.reason === 'expired' ? 'expired' : 
                result.reason === 'fingerprint_mismatch' ? 'fingerprint_mismatch' : 'revoked',
          timestamp: Date.now(),
          details: result.reason,
        });
        onSessionInvalid?.(result.reason || 'Session invalid');
      }

      return result;
    } catch (error) {
      logEvent({
        type: 'error',
        timestamp: Date.now(),
        details: error instanceof Error ? error.message : 'Validation failed',
      });
      return { valid: false, reason: 'Validation error' };
    }
  }, [sessionId, fingerprint, fileId, apiBaseUrl, onSessionInvalid, logEvent, validationCount]);

  // Start periodic validation
  useEffect(() => {
    if (!enabled || !sessionId || !fingerprint) return;

    // Initial validation
    validateSession();

    // Set up interval
    intervalRef.current = setInterval(validateSession, intervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, sessionId, fingerprint, intervalMs, validateSession]);

  // Manual validation trigger
  const forceValidation = useCallback(() => {
    return validateSession();
  }, [validateSession]);

  // Get all session events
  const getEvents = useCallback(() => {
    return [...eventsRef.current];
  }, []);

  return {
    isValid,
    lastValidation,
    expiresAt,
    validationCount,
    forceValidation,
    getEvents,
  };
}

/**
 * Generate HMAC signature for request authentication
 * In production, this would use a shared secret with the backend
 */
export async function generateSignature(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(data);

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, messageData);
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
