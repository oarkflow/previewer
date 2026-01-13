import { SecurityEvent } from '@/types/security';
interface Session {
    id: string;
    fileId: string;
    userId: string;
    fingerprint: string;
    status: string;
    createdAt: number;
    expiresAt: number;
}
interface Alert {
    id: string;
    type: string;
    sessionId: string;
    severity: string;
    message: string;
    timestamp: number;
    resolved: boolean;
}
/**
 * Export security events to CSV format
 */
export declare function exportEventsToCSV(events: SecurityEvent[]): void;
/**
 * Export sessions to CSV format
 */
export declare function exportSessionsToCSV(sessions: Session[]): void;
/**
 * Export alerts to CSV format
 */
export declare function exportAlertsToCSV(alerts: Alert[]): void;
/**
 * Generate a comprehensive PDF-style HTML report
 */
export declare function exportToPDFReport(events: SecurityEvent[], sessions: Session[], alerts: Alert[], stats: {
    activeSessions: number;
    totalEvents: number;
    criticalAlerts: number;
    blockedAttempts: number;
}): void;
export {};
