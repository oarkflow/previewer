/**
 * Security API - Client for sending security incidents to backend
 */
export interface SecurityIncident {
    incident_type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    details: Record<string, any>;
    timestamp?: number;
}
/**
 * Send a security incident report to the backend
 */
export declare function reportSecurityIncident(incident: SecurityIncident): Promise<boolean>;
/**
 * Send multiple security incidents in a batch
 */
export declare function reportSecurityIncidentsBatch(incidents: SecurityIncident[]): Promise<boolean>;
/**
 * Queue-based security incident reporter with batching and retry
 */
export declare class SecurityIncidentReporter {
    private queue;
    private batchSize;
    private flushInterval;
    private maxRetries;
    private intervalId?;
    constructor(batchSize?: number, flushInterval?: number);
    /**
     * Add an incident to the queue
     */
    add(incident: SecurityIncident): void;
    /**
     * Flush all queued incidents to backend
     */
    flush(): Promise<void>;
    /**
     * Send incident with retry logic
     */
    private sendWithRetry;
    /**
     * Start automatic flush interval
     */
    private startAutoFlush;
    /**
     * Stop the reporter and flush remaining incidents
     */
    stop(): Promise<void>;
}
/**
 * Get or create the global reporter instance
 */
export declare function getGlobalReporter(): SecurityIncidentReporter;
/**
 * Helper to quickly report common incident types
 */
export declare const SecurityIncidents: {
    copyAttempt: (details?: Record<string, any>) => {
        incident_type: string;
        severity: "medium";
        message: string;
        details: Record<string, any>;
    };
    screenshotAttempt: (details?: Record<string, any>) => {
        incident_type: string;
        severity: "high";
        message: string;
        details: Record<string, any>;
    };
    printAttempt: (details?: Record<string, any>) => {
        incident_type: string;
        severity: "high";
        message: string;
        details: Record<string, any>;
    };
    downloadAttempt: (details?: Record<string, any>) => {
        incident_type: string;
        severity: "high";
        message: string;
        details: Record<string, any>;
    };
    devToolsDetected: (details?: Record<string, any>) => {
        incident_type: string;
        severity: "critical";
        message: string;
        details: Record<string, any>;
    };
    contextMenuBlocked: (details?: Record<string, any>) => {
        incident_type: string;
        severity: "low";
        message: string;
        details: Record<string, any>;
    };
    sessionExpired: (details?: Record<string, any>) => {
        incident_type: string;
        severity: "medium";
        message: string;
        details: Record<string, any>;
    };
    visibilityChanged: (isVisible: boolean, details?: Record<string, any>) => {
        incident_type: string;
        severity: "low";
        message: string;
        details: {
            isVisible: boolean;
        };
    };
};
