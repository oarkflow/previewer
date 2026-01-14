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
export async function reportSecurityIncident(incident: SecurityIncident): Promise<boolean> {
    try {
        // Add timestamp if not present
        const incidentData = {
            ...incident,
            timestamp: incident.timestamp || Date.now(),
        };

        const response = await fetch('/api/security-incident', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(incidentData),
        });

        if (!response.ok) {
            console.error('Failed to report security incident:', response.statusText);
            return false;
        }

        const result = await response.json();
        return result.success === true;
    } catch (error) {
        console.error('Error reporting security incident:', error);
        return false;
    }
}

/**
 * Send multiple security incidents in a batch
 */
export async function reportSecurityIncidentsBatch(incidents: SecurityIncident[]): Promise<boolean> {
    try {
        const results = await Promise.all(
            incidents.map(incident => reportSecurityIncident(incident))
        );
        return results.every(result => result === true);
    } catch (error) {
        console.error('Error reporting security incidents batch:', error);
        return false;
    }
}

/**
 * Queue-based security incident reporter with batching and retry
 */
export class SecurityIncidentReporter {
    private queue: SecurityIncident[] = [];
    private batchSize = 5;
    private flushInterval = 5000; // 5 seconds
    private maxRetries = 3;
    private intervalId?: number;

    constructor(batchSize = 5, flushInterval = 5000) {
        this.batchSize = batchSize;
        this.flushInterval = flushInterval;
        this.startAutoFlush();
    }

    /**
     * Add an incident to the queue
     */
    add(incident: SecurityIncident): void {
        this.queue.push({
            ...incident,
            timestamp: incident.timestamp || Date.now(),
        });

        // Auto-flush if batch size reached
        if (this.queue.length >= this.batchSize) {
            this.flush();
        }
    }

    /**
     * Flush all queued incidents to backend
     */
    async flush(): Promise<void> {
        if (this.queue.length === 0) return;

        const incidentsToSend = this.queue.splice(0);

        for (const incident of incidentsToSend) {
            await this.sendWithRetry(incident);
        }
    }

    /**
     * Send incident with retry logic
     */
    private async sendWithRetry(incident: SecurityIncident, attempt = 1): Promise<void> {
        const success = await reportSecurityIncident(incident);

        if (!success && attempt < this.maxRetries) {
            // Exponential backoff
            const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
            await new Promise(resolve => setTimeout(resolve, delay));
            await this.sendWithRetry(incident, attempt + 1);
        }
    }

    /**
     * Start automatic flush interval
     */
    private startAutoFlush(): void {
        this.intervalId = window.setInterval(() => {
            this.flush();
        }, this.flushInterval);
    }

    /**
     * Stop the reporter and flush remaining incidents
     */
    async stop(): Promise<void> {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = undefined;
        }
        await this.flush();
    }
}

// Global singleton reporter instance
let globalReporter: SecurityIncidentReporter | null = null;

/**
 * Get or create the global reporter instance
 */
export function getGlobalReporter(): SecurityIncidentReporter {
    if (!globalReporter) {
        globalReporter = new SecurityIncidentReporter();
    }
    return globalReporter;
}

/**
 * Helper to quickly report common incident types
 */
export const SecurityIncidents = {
    copyAttempt: (details?: Record<string, any>) => ({
        incident_type: 'copy_attempt',
        severity: 'medium' as const,
        message: 'User attempted to copy content',
        details: details || {},
    }),

    screenshotAttempt: (details?: Record<string, any>) => ({
        incident_type: 'screenshot_attempt',
        severity: 'high' as const,
        message: 'User attempted to capture screenshot',
        details: details || {},
    }),

    printAttempt: (details?: Record<string, any>) => ({
        incident_type: 'print_attempt',
        severity: 'high' as const,
        message: 'User attempted to print document',
        details: details || {},
    }),

    downloadAttempt: (details?: Record<string, any>) => ({
        incident_type: 'download_attempt',
        severity: 'high' as const,
        message: 'User attempted to download file',
        details: details || {},
    }),

    devToolsDetected: (details?: Record<string, any>) => ({
        incident_type: 'dev_tools_detected',
        severity: 'critical' as const,
        message: 'Developer tools detected',
        details: details || {},
    }),

    contextMenuBlocked: (details?: Record<string, any>) => ({
        incident_type: 'context_menu_blocked',
        severity: 'low' as const,
        message: 'Context menu access blocked',
        details: details || {},
    }),

    sessionExpired: (details?: Record<string, any>) => ({
        incident_type: 'session_expired',
        severity: 'medium' as const,
        message: 'Session expired',
        details: details || {},
    }),

    visibilityChanged: (isVisible: boolean, details?: Record<string, any>) => ({
        incident_type: 'visibility_changed',
        severity: 'low' as const,
        message: isVisible ? 'Document became visible' : 'Document became hidden',
        details: { isVisible, ...details },
    }),
};
