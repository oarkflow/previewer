import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  AlertTriangle,
  Activity,
  Users,
  Eye,
  Copy,
  Download,
  Monitor,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Filter,
  Search,
  FileDown,
  FileText,
  Ban,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { SecurityEvent, SecurityEventType } from '@/types/security';
import { cn } from '@/lib/utils';
import { 
  exportEventsToCSV, 
  exportSessionsToCSV, 
  exportAlertsToCSV, 
  exportToPDFReport 
} from '@/lib/export-utils';
import { toast } from 'sonner';

interface Session {
  id: string;
  fileId: string;
  userId: string;
  fingerprint: string;
  status: 'active' | 'expired' | 'revoked';
  createdAt: number;
  expiresAt: number;
}

interface Alert {
  id: string;
  type: string;
  sessionId: string;
  severity: 'critical' | 'high' | 'medium';
  message: string;
  timestamp: number;
  resolved: boolean;
}

// Initial mock data
const INITIAL_SESSIONS: Session[] = [
  { id: 'sess_1a2b3c4d', fileId: 'doc_001', userId: 'user_123', fingerprint: 'fp_abc123', status: 'active', createdAt: Date.now() - 3600000, expiresAt: Date.now() + 3600000 },
  { id: 'sess_2b3c4d5e', fileId: 'doc_002', userId: 'user_456', fingerprint: 'fp_def456', status: 'active', createdAt: Date.now() - 7200000, expiresAt: Date.now() + 1800000 },
  { id: 'sess_3c4d5e6f', fileId: 'doc_003', userId: 'user_789', fingerprint: 'fp_ghi789', status: 'expired', createdAt: Date.now() - 86400000, expiresAt: Date.now() - 82800000 },
  { id: 'sess_4d5e6f7g', fileId: 'doc_001', userId: 'user_123', fingerprint: 'fp_jkl012', status: 'revoked', createdAt: Date.now() - 172800000, expiresAt: Date.now() - 169200000 },
];

const INITIAL_EVENTS: SecurityEvent[] = [
  { type: 'file_opened', sessionId: 'sess_1a2b3c4d', fileId: 'doc_001', timestamp: Date.now() - 60000 },
  { type: 'copy_attempt', sessionId: 'sess_1a2b3c4d', fileId: 'doc_001', timestamp: Date.now() - 45000, metadata: { blocked: true } },
  { type: 'screenshot_attempt', sessionId: 'sess_2b3c4d5e', fileId: 'doc_002', timestamp: Date.now() - 30000 },
  { type: 'dev_tools_detected', sessionId: 'sess_3c4d5e6f', fileId: 'doc_003', timestamp: Date.now() - 15000 },
  { type: 'download_attempt', sessionId: 'sess_1a2b3c4d', fileId: 'doc_001', timestamp: Date.now() - 10000, metadata: { blocked: true } },
  { type: 'visibility_changed', sessionId: 'sess_2b3c4d5e', fileId: 'doc_002', timestamp: Date.now() - 5000, metadata: { hidden: true } },
  { type: 'context_menu_blocked', sessionId: 'sess_1a2b3c4d', fileId: 'doc_001', timestamp: Date.now() - 2000 },
];

const INITIAL_ALERTS: Alert[] = [
  { id: 'alert_1', type: 'fingerprint_mismatch', sessionId: 'sess_4d5e6f7g', severity: 'critical', message: 'Device fingerprint mismatch detected', timestamp: Date.now() - 120000, resolved: false },
  { id: 'alert_2', type: 'multiple_screenshots', sessionId: 'sess_2b3c4d5e', severity: 'high', message: 'Multiple screenshot attempts detected', timestamp: Date.now() - 60000, resolved: false },
  { id: 'alert_3', type: 'devtools_persistent', sessionId: 'sess_3c4d5e6f', severity: 'medium', message: 'DevTools open for extended period', timestamp: Date.now() - 30000, resolved: true },
];

const SecurityDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [eventFilter, setEventFilter] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // State for data management
  const [sessions, setSessions] = useState<Session[]>(INITIAL_SESSIONS);
  const [events] = useState<SecurityEvent[]>(INITIAL_EVENTS);
  const [alerts, setAlerts] = useState<Alert[]>(INITIAL_ALERTS);
  
  // State for session revocation dialog
  const [sessionToRevoke, setSessionToRevoke] = useState<Session | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  // Computed stats
  const stats = useMemo(() => {
    const activeSessions = sessions.filter(s => s.status === 'active').length;
    const totalEvents = events.length;
    const criticalAlerts = alerts.filter(a => a.severity === 'critical' && !a.resolved).length;
    const blockedAttempts = events.filter(e => 
      e.type === 'copy_attempt' || e.type === 'download_attempt' || e.type === 'screenshot_attempt'
    ).length;

    return { activeSessions, totalEvents, criticalAlerts, blockedAttempts };
  }, [sessions, events, alerts]);

  const filteredEvents = useMemo(() => {
    let filtered = [...events];
    if (eventFilter !== 'all') {
      filtered = filtered.filter(e => e.type === eventFilter);
    }
    if (searchQuery) {
      filtered = filtered.filter(e => 
        e.sessionId.includes(searchQuery) || 
        e.fileId.includes(searchQuery)
      );
    }
    return filtered.sort((a, b) => b.timestamp - a.timestamp);
  }, [events, eventFilter, searchQuery]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success('Data refreshed');
    }, 1000);
  };

  // Session revocation handler
  const handleRevokeSession = useCallback(async (session: Session) => {
    setIsRevoking(true);
    
    // Simulate API call to backend
    // In production: await fetch(`${apiBaseUrl}/auth/revoke-session`, { method: 'POST', body: JSON.stringify({ sessionId: session.id }) })
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Update local state
    setSessions(prev => prev.map(s => 
      s.id === session.id ? { ...s, status: 'revoked' as const } : s
    ));
    
    // Add a revocation event
    toast.success(`Session ${session.id.slice(0, 12)}... has been revoked`);
    
    setIsRevoking(false);
    setSessionToRevoke(null);
  }, []);

  // Resolve alert handler
  const handleResolveAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.map(a => 
      a.id === alertId ? { ...a, resolved: true } : a
    ));
    toast.success('Alert marked as resolved');
  }, []);

  // Export handlers
  const handleExportEventsCSV = useCallback(() => {
    exportEventsToCSV(events);
    toast.success('Events exported to CSV');
  }, [events]);

  const handleExportSessionsCSV = useCallback(() => {
    exportSessionsToCSV(sessions);
    toast.success('Sessions exported to CSV');
  }, [sessions]);

  const handleExportAlertsCSV = useCallback(() => {
    exportAlertsToCSV(alerts);
    toast.success('Alerts exported to CSV');
  }, [alerts]);

  const handleExportPDF = useCallback(() => {
    exportToPDFReport(events, sessions, alerts, stats);
    toast.success('PDF report opened in new tab');
  }, [events, sessions, alerts, stats]);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getEventIcon = (type: SecurityEventType) => {
    switch (type) {
      case 'copy_attempt': return <Copy className="w-4 h-4" />;
      case 'screenshot_attempt': return <Monitor className="w-4 h-4" />;
      case 'download_attempt': return <Download className="w-4 h-4" />;
      case 'dev_tools_detected': return <AlertTriangle className="w-4 h-4" />;
      case 'visibility_changed': return <Eye className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getEventColor = (type: SecurityEventType) => {
    switch (type) {
      case 'screenshot_attempt':
      case 'dev_tools_detected':
        return 'text-red-500';
      case 'copy_attempt':
      case 'download_attempt':
      case 'visibility_changed':
        return 'text-yellow-500';
      default:
        return 'text-blue-500';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Security Dashboard</h1>
                <p className="text-sm text-muted-foreground">Real-time monitoring & audit trail</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <FileDown className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Export Options</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleExportPDF}>
                    <FileText className="w-4 h-4 mr-2" />
                    Full Report (PDF)
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleExportEventsCSV}>
                    <Download className="w-4 h-4 mr-2" />
                    Events (CSV)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportSessionsCSV}>
                    <Download className="w-4 h-4 mr-2" />
                    Sessions (CSV)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportAlertsCSV}>
                    <Download className="w-4 h-4 mr-2" />
                    Alerts (CSV)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={cn("w-4 h-4 mr-2", isRefreshing && "animate-spin")} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Active Sessions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.activeSessions}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="text-green-500">↑ 12%</span> from last hour
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Total Events
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalEvents}</div>
                <p className="text-xs text-muted-foreground mt-1">Last 24 hours</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className={stats.criticalAlerts > 0 ? 'border-red-500/50' : ''}>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Critical Alerts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className={cn("text-3xl font-bold", stats.criticalAlerts > 0 && "text-red-500")}>
                  {stats.criticalAlerts}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Requires attention</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Blocked Attempts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-500">{stats.blockedAttempts}</div>
                <p className="text-xs text-muted-foreground mt-1">Copy, download, screenshot</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="events">Event Log</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Recent Alerts */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                    Recent Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    <div className="space-y-3">
                      {alerts.map((alert) => (
                        <div
                          key={alert.id}
                          className={cn(
                            "p-3 rounded-lg border",
                            alert.resolved ? "bg-secondary/30 border-border" : 
                            alert.severity === 'critical' ? "bg-red-500/10 border-red-500/30" :
                            alert.severity === 'high' ? "bg-yellow-500/10 border-yellow-500/30" :
                            "bg-secondary/50 border-border"
                          )}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              {alert.resolved ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : alert.severity === 'critical' ? (
                                <XCircle className="w-4 h-4 text-red-500" />
                              ) : (
                                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                              )}
                              <span className="font-medium text-sm">{alert.message}</span>
                            </div>
                            <Badge variant={alert.resolved ? "secondary" : alert.severity === 'critical' ? "destructive" : "outline"}>
                              {alert.severity}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Session: {alert.sessionId} • {formatTime(alert.timestamp)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Recent Events */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary" />
                    Recent Events
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    <div className="space-y-2">
                      {events.slice(0, 6).map((event, index) => (
                        <div
                          key={`${event.timestamp}-${index}`}
                          className="flex items-center gap-3 p-2 rounded-lg bg-secondary/30"
                        >
                          <div className={getEventColor(event.type)}>
                            {getEventIcon(event.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium capitalize">
                              {event.type.replace(/_/g, ' ')}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {event.sessionId}
                            </p>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatTime(event.timestamp)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Sessions Tab */}
          <TabsContent value="sessions">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Active Sessions</CardTitle>
                    <CardDescription>Monitor and manage file viewing sessions</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleExportSessionsCSV}>
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Session ID</TableHead>
                      <TableHead>File ID</TableHead>
                      <TableHead>User ID</TableHead>
                      <TableHead>Fingerprint</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessions.map((session) => (
                      <TableRow key={session.id}>
                        <TableCell className="font-mono text-sm">{session.id}</TableCell>
                        <TableCell>{session.fileId}</TableCell>
                        <TableCell>{session.userId}</TableCell>
                        <TableCell className="font-mono text-xs">{session.fingerprint}</TableCell>
                        <TableCell>
                          <Badge variant={
                            session.status === 'active' ? 'default' :
                            session.status === 'expired' ? 'secondary' : 'destructive'
                          }>
                            {session.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{formatTime(session.createdAt)}</TableCell>
                        <TableCell className="text-sm">{formatTime(session.expiresAt)}</TableCell>
                        <TableCell className="text-right">
                          {session.status === 'active' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-600 hover:bg-red-50"
                              onClick={() => setSessionToRevoke(session)}
                            >
                              <Ban className="w-4 h-4 mr-1" />
                              Revoke
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Event Log</CardTitle>
                    <CardDescription>Complete audit trail of security events</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search sessions..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 w-48"
                      />
                    </div>
                    <Select value={eventFilter} onValueChange={setEventFilter}>
                      <SelectTrigger className="w-40">
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Events</SelectItem>
                        <SelectItem value="copy_attempt">Copy Attempts</SelectItem>
                        <SelectItem value="screenshot_attempt">Screenshots</SelectItem>
                        <SelectItem value="download_attempt">Downloads</SelectItem>
                        <SelectItem value="dev_tools_detected">DevTools</SelectItem>
                        <SelectItem value="visibility_changed">Visibility</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Session ID</TableHead>
                      <TableHead>File ID</TableHead>
                      <TableHead>Metadata</TableHead>
                      <TableHead>Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEvents.map((event, index) => (
                      <TableRow key={`${event.timestamp}-${index}`}>
                        <TableCell>
                          <div className={cn("flex items-center gap-2", getEventColor(event.type))}>
                            {getEventIcon(event.type)}
                            <span className="capitalize">{event.type.replace(/_/g, ' ')}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{event.sessionId}</TableCell>
                        <TableCell>{event.fileId}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {event.metadata ? JSON.stringify(event.metadata) : '-'}
                        </TableCell>
                        <TableCell className="text-sm">{formatTime(event.timestamp)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Security Alerts</CardTitle>
                    <CardDescription>Critical security events requiring attention</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleExportAlertsCSV}>
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <AnimatePresence>
                    {alerts.map((alert) => (
                      <motion.div
                        key={alert.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className={cn(
                          "p-4 rounded-lg border",
                          alert.resolved ? "bg-secondary/30" :
                          alert.severity === 'critical' ? "bg-red-500/10 border-red-500/50" :
                          alert.severity === 'high' ? "bg-yellow-500/10 border-yellow-500/50" :
                          "bg-secondary/50"
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            {alert.resolved ? (
                              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                            ) : alert.severity === 'critical' ? (
                              <XCircle className="w-5 h-5 text-red-500 mt-0.5" />
                            ) : alert.severity === 'high' ? (
                              <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
                            ) : (
                              <AlertCircle className="w-5 h-5 text-muted-foreground mt-0.5" />
                            )}
                            <div>
                              <h4 className="font-medium">{alert.message}</h4>
                              <p className="text-sm text-muted-foreground mt-1">
                                Type: {alert.type.replace(/_/g, ' ')} • Session: {alert.sessionId}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatTime(alert.timestamp)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={
                              alert.resolved ? "secondary" :
                              alert.severity === 'critical' ? "destructive" : "outline"
                            }>
                              {alert.resolved ? 'Resolved' : alert.severity}
                            </Badge>
                            {!alert.resolved && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleResolveAlert(alert.id)}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Resolve
                              </Button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Session Revocation Confirmation Dialog */}
      <AlertDialog open={!!sessionToRevoke} onOpenChange={() => setSessionToRevoke(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Ban className="w-5 h-5 text-red-500" />
              Revoke Session
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke this session? This action cannot be undone.
              <div className="mt-4 p-3 bg-secondary/50 rounded-lg space-y-1 text-sm">
                <p><strong>Session ID:</strong> {sessionToRevoke?.id}</p>
                <p><strong>User ID:</strong> {sessionToRevoke?.userId}</p>
                <p><strong>File ID:</strong> {sessionToRevoke?.fileId}</p>
                <p><strong>Device:</strong> {sessionToRevoke?.fingerprint}</p>
              </div>
              <p className="mt-4 text-yellow-600 dark:text-yellow-500">
                The user will immediately lose access to the document and be required to re-authenticate.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRevoking}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              disabled={isRevoking}
              onClick={(e) => {
                e.preventDefault();
                if (sessionToRevoke) {
                  handleRevokeSession(sessionToRevoke);
                }
              }}
            >
              {isRevoking ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Revoking...
                </>
              ) : (
                <>
                  <Ban className="w-4 h-4 mr-2" />
                  Revoke Session
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SecurityDashboard;
