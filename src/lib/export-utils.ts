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
export function exportEventsToCSV(events: SecurityEvent[]): void {
  const headers = ['Timestamp', 'Type', 'Session ID', 'File ID', 'Metadata'];
  
  const rows = events.map(event => [
    new Date(event.timestamp).toISOString(),
    event.type,
    event.sessionId,
    event.fileId,
    event.metadata ? JSON.stringify(event.metadata) : '',
  ]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');
  
  downloadFile(csvContent, 'security-events.csv', 'text/csv');
}

/**
 * Export sessions to CSV format
 */
export function exportSessionsToCSV(sessions: Session[]): void {
  const headers = ['Session ID', 'File ID', 'User ID', 'Fingerprint', 'Status', 'Created At', 'Expires At'];
  
  const rows = sessions.map(session => [
    session.id,
    session.fileId,
    session.userId,
    session.fingerprint,
    session.status,
    new Date(session.createdAt).toISOString(),
    new Date(session.expiresAt).toISOString(),
  ]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');
  
  downloadFile(csvContent, 'sessions.csv', 'text/csv');
}

/**
 * Export alerts to CSV format
 */
export function exportAlertsToCSV(alerts: Alert[]): void {
  const headers = ['Alert ID', 'Type', 'Session ID', 'Severity', 'Message', 'Timestamp', 'Resolved'];
  
  const rows = alerts.map(alert => [
    alert.id,
    alert.type,
    alert.sessionId,
    alert.severity,
    alert.message,
    new Date(alert.timestamp).toISOString(),
    alert.resolved ? 'Yes' : 'No',
  ]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');
  
  downloadFile(csvContent, 'security-alerts.csv', 'text/csv');
}

/**
 * Generate a comprehensive PDF-style HTML report
 */
export function exportToPDFReport(
  events: SecurityEvent[],
  sessions: Session[],
  alerts: Alert[],
  stats: { activeSessions: number; totalEvents: number; criticalAlerts: number; blockedAttempts: number }
): void {
  const reportDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const formatTimestamp = (ts: number) => new Date(ts).toLocaleString();

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Security Audit Report - ${reportDate}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
      line-height: 1.6; 
      color: #1a1a1a;
      padding: 40px;
      max-width: 1000px;
      margin: 0 auto;
    }
    .header { 
      border-bottom: 3px solid #2563eb; 
      padding-bottom: 20px; 
      margin-bottom: 30px; 
    }
    .header h1 { 
      font-size: 28px; 
      color: #1e40af; 
      margin-bottom: 8px; 
    }
    .header .date { 
      color: #6b7280; 
      font-size: 14px; 
    }
    .stats-grid { 
      display: grid; 
      grid-template-columns: repeat(4, 1fr); 
      gap: 16px; 
      margin-bottom: 40px; 
    }
    .stat-card { 
      background: #f8fafc; 
      border: 1px solid #e2e8f0; 
      border-radius: 8px; 
      padding: 20px; 
      text-align: center; 
    }
    .stat-card .value { 
      font-size: 32px; 
      font-weight: 700; 
      color: #1e40af; 
    }
    .stat-card .label { 
      font-size: 12px; 
      color: #6b7280; 
      text-transform: uppercase; 
      letter-spacing: 0.5px; 
    }
    .stat-card.critical .value { color: #dc2626; }
    .stat-card.warning .value { color: #f59e0b; }
    .section { margin-bottom: 40px; }
    .section h2 { 
      font-size: 20px; 
      color: #1e40af; 
      border-bottom: 2px solid #e2e8f0; 
      padding-bottom: 10px; 
      margin-bottom: 20px; 
    }
    table { 
      width: 100%; 
      border-collapse: collapse; 
      font-size: 13px; 
    }
    th { 
      background: #1e40af; 
      color: white; 
      padding: 12px 8px; 
      text-align: left; 
      font-weight: 600; 
    }
    td { 
      padding: 10px 8px; 
      border-bottom: 1px solid #e2e8f0; 
    }
    tr:nth-child(even) { background: #f8fafc; }
    .badge { 
      display: inline-block; 
      padding: 2px 8px; 
      border-radius: 4px; 
      font-size: 11px; 
      font-weight: 600; 
      text-transform: uppercase; 
    }
    .badge-critical { background: #fee2e2; color: #dc2626; }
    .badge-high { background: #fef3c7; color: #d97706; }
    .badge-medium { background: #e0e7ff; color: #4f46e5; }
    .badge-active { background: #dcfce7; color: #16a34a; }
    .badge-expired { background: #f3f4f6; color: #6b7280; }
    .badge-revoked { background: #fee2e2; color: #dc2626; }
    .footer { 
      margin-top: 40px; 
      padding-top: 20px; 
      border-top: 1px solid #e2e8f0; 
      text-align: center; 
      color: #6b7280; 
      font-size: 12px; 
    }
    @media print {
      body { padding: 20px; }
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🔒 Security Audit Report</h1>
    <p class="date">Generated: ${reportDate}</p>
  </div>

  <div class="stats-grid">
    <div class="stat-card">
      <div class="value">${stats.activeSessions}</div>
      <div class="label">Active Sessions</div>
    </div>
    <div class="stat-card">
      <div class="value">${stats.totalEvents}</div>
      <div class="label">Total Events</div>
    </div>
    <div class="stat-card critical">
      <div class="value">${stats.criticalAlerts}</div>
      <div class="label">Critical Alerts</div>
    </div>
    <div class="stat-card warning">
      <div class="value">${stats.blockedAttempts}</div>
      <div class="label">Blocked Attempts</div>
    </div>
  </div>

  <div class="section">
    <h2>Security Alerts (${alerts.length})</h2>
    <table>
      <thead>
        <tr>
          <th>Severity</th>
          <th>Type</th>
          <th>Message</th>
          <th>Session</th>
          <th>Timestamp</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${alerts.map(alert => `
          <tr>
            <td><span class="badge badge-${alert.severity}">${alert.severity}</span></td>
            <td>${alert.type.replace(/_/g, ' ')}</td>
            <td>${alert.message}</td>
            <td><code>${alert.sessionId}</code></td>
            <td>${formatTimestamp(alert.timestamp)}</td>
            <td>${alert.resolved ? '✓ Resolved' : '⚠ Open'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <div class="section">
    <h2>Sessions (${sessions.length})</h2>
    <table>
      <thead>
        <tr>
          <th>Session ID</th>
          <th>File ID</th>
          <th>User ID</th>
          <th>Status</th>
          <th>Created</th>
          <th>Expires</th>
        </tr>
      </thead>
      <tbody>
        ${sessions.map(session => `
          <tr>
            <td><code>${session.id}</code></td>
            <td>${session.fileId}</td>
            <td>${session.userId}</td>
            <td><span class="badge badge-${session.status}">${session.status}</span></td>
            <td>${formatTimestamp(session.createdAt)}</td>
            <td>${formatTimestamp(session.expiresAt)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <div class="section">
    <h2>Recent Security Events (${events.length})</h2>
    <table>
      <thead>
        <tr>
          <th>Type</th>
          <th>Session ID</th>
          <th>File ID</th>
          <th>Metadata</th>
          <th>Timestamp</th>
        </tr>
      </thead>
      <tbody>
        ${events.slice(0, 50).map(event => `
          <tr>
            <td>${event.type.replace(/_/g, ' ')}</td>
            <td><code>${event.sessionId}</code></td>
            <td>${event.fileId}</td>
            <td>${event.metadata ? JSON.stringify(event.metadata) : '-'}</td>
            <td>${formatTimestamp(event.timestamp)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    ${events.length > 50 ? `<p style="color: #6b7280; margin-top: 10px; font-size: 12px;">Showing 50 of ${events.length} events. Export CSV for complete data.</p>` : ''}
  </div>

  <div class="footer">
    <p>This report was automatically generated by the Security Audit System.</p>
    <p>For questions, contact your security administrator.</p>
  </div>
</body>
</html>
  `;

  // Open in new window for printing as PDF
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    // Trigger print dialog after content loads
    printWindow.onload = () => {
      setTimeout(() => printWindow.print(), 250);
    };
  }
}

/**
 * Helper function to download a file
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
