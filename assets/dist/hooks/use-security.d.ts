import { SecurityConfig, SecurityEvent, SecurityEventType } from '@/types/security';
interface UseSecurityOptions {
    config?: SecurityConfig;
    fileId?: string;
    sessionId?: string;
    onSecurityEvent?: (event: SecurityEvent) => void;
    onSecurityViolation?: (type: SecurityEventType, message: string) => void;
}
/**
 * Enhanced security hook with comprehensive protection
 * - DevTools detection and blocking
 * - Right-click prevention
 * - Copy/paste blocking
 * - Screenshot resistance
 * - Print blocking
 * - Keyboard shortcut blocking
 * - Activity logging
 */
export declare function useSecurity({ config: providedConfig, fileId, sessionId, onSecurityEvent, onSecurityViolation, }: UseSecurityOptions): {
    sessionId: string;
    devToolsOpen: boolean;
    isBlurred: boolean;
    logEvent: (type: SecurityEventType, metadata?: Record<string, unknown>) => void;
    getEvents: () => SecurityEvent[];
};
export {};
