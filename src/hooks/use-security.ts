import { useEffect, useCallback, useRef, useState } from 'react';
import { SecurityConfig, SecurityEvent, SecurityEventType, DEFAULT_SECURITY_CONFIG } from '@/types/security';
import { getGlobalReporter, SecurityIncidents } from '@/lib/security-api';

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
export function useSecurity({
    config: providedConfig,
    fileId = 'unknown',
    sessionId = generateSessionId(),
    onSecurityEvent,
    onSecurityViolation,
}: UseSecurityOptions) {
    // Ensure config is never null/undefined
    const config = providedConfig || DEFAULT_SECURITY_CONFIG;

    const sessionIdRef = useRef(sessionId);
    const eventQueueRef = useRef<SecurityEvent[]>([]);
    const [devToolsOpen, setDevToolsOpen] = useState(false);
    const [isBlurred, setIsBlurred] = useState(false);
    const lastViolationRef = useRef<Partial<Record<SecurityEventType, number>>>({});

    // Log security event
    const logEvent = useCallback((type: SecurityEventType, metadata?: Record<string, unknown>) => {
        const event: SecurityEvent = {
            type,
            timestamp: Date.now(),
            fileId,
            sessionId: sessionIdRef.current,
            metadata,
        };

        eventQueueRef.current.push(event);
        onSecurityEvent?.(event);

        if (config?.activityLogging) {
            console.debug('[Security Event]', type, metadata);
        }
    }, [fileId, config?.activityLogging, onSecurityEvent]);

    // Alert for security violations
    const alertViolation = useCallback((type: SecurityEventType, message: string) => {
        const now = Date.now();
        const last = lastViolationRef.current[type] || 0;
        // Throttle duplicate alerts (prevents infinite toasts for DevTools)
        if (now - last < 5000) {
            return;
        }
        lastViolationRef.current[type] = now;

        logEvent(type, { message, blocked: true });
        onSecurityViolation?.(type, message);

        // Send to backend
        const incidentMap: Record<SecurityEventType, () => any> = {
            'copy_attempt': () => SecurityIncidents.copyAttempt({ fileId, sessionId }),
            'screenshot_attempt': () => SecurityIncidents.screenshotAttempt({ fileId, sessionId }),
            'print_attempt': () => SecurityIncidents.printAttempt({ fileId, sessionId }),
            'download_attempt': () => SecurityIncidents.downloadAttempt({ fileId, sessionId }),
            'dev_tools_detected': () => SecurityIncidents.devToolsDetected({ fileId, sessionId }),
            'context_menu_blocked': () => SecurityIncidents.contextMenuBlocked({ fileId, sessionId }),
            'session_expired': () => SecurityIncidents.sessionExpired({ fileId, sessionId }),
            'visibility_changed': () => SecurityIncidents.visibilityChanged(false, { fileId, sessionId }),
            'file_opened': () => ({
                incident_type: 'file_opened',
                severity: 'low' as const,
                message: 'File opened',
                details: { fileId, sessionId },
            }),
            'file_closed': () => ({
                incident_type: 'file_closed',
                severity: 'low' as const,
                message: 'File closed',
                details: { fileId, sessionId },
            }),
        };

        const incidentFactory = incidentMap[type];
        if (incidentFactory) {
            const reporter = getGlobalReporter();
            reporter.add(incidentFactory());
        }

        // Best-effort: notify the local Go preview server so it can terminate the session.
        // This only applies when running via `main.go` (websocket is absent in dev mode / embedded usage).
        try {
            if (typeof window === 'undefined') return;
            const ws = (window as any).__UFV_PREVIEW_WS__ as WebSocket | undefined;
            if (ws && ws.readyState === WebSocket.OPEN) {
                const shouldTerminate =
                    (type === 'dev_tools_detected' || type === 'screenshot_attempt' || type === 'print_attempt') ||
                    (config.noDownload && type === 'download_attempt');
                if (shouldTerminate) {
                    ws.send(`VIOLATION:${type}:${message}`);
                }
            }
        } catch {
            // ignore
        }
    }, [logEvent, onSecurityViolation, config.noDownload, fileId, sessionId]);

    const setDevToolsState = useCallback((open: boolean, method: 'window_size' | 'console_probe') => {
        if (typeof document === 'undefined') {
            return;
        }

        setDevToolsOpen((prev) => {
            if (prev === open) {
                return prev;
            }

            if (open) {
                setIsBlurred(true);
                alertViolation('dev_tools_detected', `Developer tools detected (${method === 'window_size' ? 'docked' : 'undocked'})`);
                document.body.classList.add('security-blur', 'devtools-blocked');
            } else {
                if (!document.hidden) {
                    setIsBlurred(false);
                }
                document.body.classList.remove('security-blur', 'devtools-blocked');
            }

            return open;
        });
    }, [alertViolation]);

    // ============ DEVTOOLS DETECTION ============
    useEffect(() => {
        if (!config.screenshotResistant) return;

        const threshold = 160;
        let consoleProbeTimer: number | undefined;
        let intervalId: number | undefined;

        const sizeHeuristic = () => {
            const widthThreshold = Math.abs(window.outerWidth - window.innerWidth) > threshold;
            const heightThreshold = Math.abs(window.outerHeight - window.innerHeight) > threshold;
            return widthThreshold || heightThreshold;
        };

        const probeConsole = () => {
            let detected = false;
            const element = new Image();
            Object.defineProperty(element, 'id', {
                get() {
                    detected = true;
                    return '';
                },
            });

            if (consoleProbeTimer) {
                clearTimeout(consoleProbeTimer);
            }

            consoleProbeTimer = window.setTimeout(() => {
                setDevToolsState(detected, 'console_probe');
            }, 60);
        };

        const checkDevTools = () => {
            if (sizeHeuristic()) {
                setDevToolsState(true, 'window_size');
                return;
            }

            probeConsole();
        };

        checkDevTools();
        window.addEventListener('resize', checkDevTools);
        intervalId = window.setInterval(checkDevTools, 1200);

        return () => {
            window.removeEventListener('resize', checkDevTools);
            if (intervalId) {
                clearInterval(intervalId);
            }
            if (consoleProbeTimer) {
                clearTimeout(consoleProbeTimer);
            }
            document.body.classList.remove('security-blur', 'devtools-blocked');
            setDevToolsOpen(false);
        };
    }, [config.screenshotResistant, setDevToolsState]);

    // ============ KEYBOARD BLOCKING ============
    useEffect(() => {
        if (!config.noCopy && !config.noDownload && !config.screenshotResistant) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();
            const isCtrlOrMeta = e.ctrlKey || e.metaKey;

            // Block copy/cut/select all
            if (config.noCopy && isCtrlOrMeta && ['c', 'x', 'a'].includes(key)) {
                e.preventDefault();
                e.stopPropagation();
                alertViolation('copy_attempt', 'Copy operation blocked');
                return false;
            }

            // Block save (download)
            if (config.noDownload && isCtrlOrMeta && key === 's') {
                e.preventDefault();
                e.stopPropagation();
                alertViolation('download_attempt', 'Save operation blocked');
                return false;
            }

            // Block print
            if (config.screenshotResistant && isCtrlOrMeta && key === 'p') {
                e.preventDefault();
                e.stopPropagation();
                alertViolation('print_attempt', 'Print operation blocked');
                return false;
            }

            // Block PrintScreen
            if (e.key === 'PrintScreen') {
                e.preventDefault();
                e.stopPropagation();
                alertViolation('screenshot_attempt', 'Screenshot blocked');

                // Flash screen to corrupt any screenshot
                document.body.classList.add('security-flash');
                setTimeout(() => document.body.classList.remove('security-flash'), 100);
                return false;
            }

            // Block F12 (DevTools)
            if (config.screenshotResistant && e.key === 'F12') {
                e.preventDefault();
                e.stopPropagation();
                alertViolation('dev_tools_detected', 'DevTools access blocked');
                return false;
            }

            // Block Ctrl+Shift+I/J/C (DevTools shortcuts)
            if (config.screenshotResistant && isCtrlOrMeta && e.shiftKey && ['i', 'j', 'c'].includes(key)) {
                e.preventDefault();
                e.stopPropagation();
                alertViolation('dev_tools_detected', 'DevTools access blocked');
                return false;
            }

            // Block Ctrl+U (View source)
            if (config.screenshotResistant && isCtrlOrMeta && key === 'u') {
                e.preventDefault();
                e.stopPropagation();
                alertViolation('dev_tools_detected', 'View source blocked');
                return false;
            }
        };

        const handleCopy = (e: ClipboardEvent) => {
            if (config.noCopy) {
                e.preventDefault();
                e.stopPropagation();
                alertViolation('copy_attempt', 'Clipboard copy blocked');
            }
        };

        const handleCut = (e: ClipboardEvent) => {
            if (config.noCopy) {
                e.preventDefault();
                e.stopPropagation();
                alertViolation('copy_attempt', 'Clipboard cut blocked');
            }
        };

        const handlePaste = (e: ClipboardEvent) => {
            if (config.noCopy) {
                e.preventDefault();
                e.stopPropagation();
            }
        };

        document.addEventListener('keydown', handleKeyDown, true);
        document.addEventListener('copy', handleCopy, true);
        document.addEventListener('cut', handleCut, true);
        document.addEventListener('paste', handlePaste, true);

        return () => {
            document.removeEventListener('keydown', handleKeyDown, true);
            document.removeEventListener('copy', handleCopy, true);
            document.removeEventListener('cut', handleCut, true);
            document.removeEventListener('paste', handlePaste, true);
        };
    }, [config.noCopy, config.noDownload, config.screenshotResistant, alertViolation]);

    // ============ CONTEXT MENU (RIGHT-CLICK) BLOCKING ============
    useEffect(() => {
        if (!config.noCopy && !config.noDownload) return;

        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            alertViolation('context_menu_blocked', 'Context menu blocked');
            return false;
        };

        document.addEventListener('contextmenu', handleContextMenu, true);
        return () => document.removeEventListener('contextmenu', handleContextMenu, true);
    }, [config.noCopy, config.noDownload, alertViolation]);

    // ============ DRAG & DROP PREVENTION ============
    useEffect(() => {
        if (!config.noDownload) return;

        const handleDrag = (e: DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
        };

        const handleDragStart = (e: DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            alertViolation('download_attempt', 'Drag download blocked');
            return false;
        };

        document.addEventListener('drag', handleDrag, true);
        document.addEventListener('dragstart', handleDragStart, true);
        document.addEventListener('dragend', handleDrag, true);

        return () => {
            document.removeEventListener('drag', handleDrag, true);
            document.removeEventListener('dragstart', handleDragStart, true);
            document.removeEventListener('dragend', handleDrag, true);
        };
    }, [config.noDownload, alertViolation]);

    // ============ SCREENSHOT RESISTANCE (VISIBILITY & FOCUS) ============
    useEffect(() => {
        if (!config.screenshotResistant) return;

        const handleVisibilityChange = () => {
            if (document.hidden) {
                logEvent('visibility_changed', { hidden: true });
                setIsBlurred(true);
                document.body.classList.add('security-blur');
            } else {
                // Delay unblur to catch quick tab switching
                setTimeout(() => {
                    if (!document.hidden) {
                        setIsBlurred(false);
                        document.body.classList.remove('security-blur');
                    }
                }, 300);
            }
        };

        const handleBlur = () => {
            logEvent('screenshot_attempt', { method: 'window_blur' });
            setIsBlurred(true);
            document.body.classList.add('security-blur');
        };

        const handleFocus = () => {
            setTimeout(() => {
                setIsBlurred(false);
                document.body.classList.remove('security-blur');
            }, 300);
        };

        // Detect screen sharing/recording via getDisplayMedia permission
        const detectScreenShare = async () => {
            try {
                if (navigator.mediaDevices && 'getDisplayMedia' in navigator.mediaDevices) {
                    // Monitor for screen sharing attempts
                    navigator.mediaDevices.addEventListener?.('devicechange', () => {
                        logEvent('screenshot_attempt', { method: 'screen_share_detected' });
                    });
                }
            } catch {
                // Ignore
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleBlur);
        window.addEventListener('focus', handleFocus);
        detectScreenShare();

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleBlur);
            window.removeEventListener('focus', handleFocus);
            document.body.classList.remove('security-blur');
        };
    }, [config.screenshotResistant, logEvent]);

    // ============ PRINT BLOCKING ============
    useEffect(() => {
        if (!config.screenshotResistant) return;

        const handleBeforePrint = () => {
            alertViolation('print_attempt', 'Print blocked');
            document.body.classList.add('security-blur', 'print-blocked');
        };

        const handleAfterPrint = () => {
            document.body.classList.remove('security-blur', 'print-blocked');
        };

        window.addEventListener('beforeprint', handleBeforePrint);
        window.addEventListener('afterprint', handleAfterPrint);

        return () => {
            window.removeEventListener('beforeprint', handleBeforePrint);
            window.removeEventListener('afterprint', handleAfterPrint);
        };
    }, [config.screenshotResistant, alertViolation]);

    // ============ SESSION TIMEOUT ============
    useEffect(() => {
        if (!config.sessionTimeout) return;

        const timeout = setTimeout(() => {
            logEvent('session_expired', { reason: 'timeout' });
            onSecurityViolation?.('session_expired', 'Session has expired');
        }, config.sessionTimeout);

        return () => clearTimeout(timeout);
    }, [config.sessionTimeout, logEvent, onSecurityViolation]);

    // Get accumulated events for batch sending to backend
    const getEvents = useCallback(() => {
        const events = [...eventQueueRef.current];
        eventQueueRef.current = [];
        return events;
    }, []);

    return {
        sessionId: sessionIdRef.current,
        devToolsOpen,
        isBlurred,
        logEvent,
        getEvents,
    };
}

function generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}
