import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  Shield, 
  AlertTriangle, 
  Eye, 
  Copy, 
  Download, 
  Printer,
  Monitor,
  Clock,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  FileText,
  FileDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SecurityEvent, SecurityEventType } from '@/types/security';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface AuditTrailViewerProps {
  events: SecurityEvent[];
  className?: string;
  onClear?: () => void;
}

interface EventTypeConfig {
  icon: React.ReactNode;
  label: string;
  severity: 'info' | 'warning' | 'error';
  color: string;
}

const EVENT_CONFIG: Record<SecurityEventType, EventTypeConfig> = {
  file_opened: {
    icon: <FileText className="w-4 h-4" />,
    label: 'File Opened',
    severity: 'info',
    color: 'text-blue-500',
  },
  file_closed: {
    icon: <FileText className="w-4 h-4" />,
    label: 'File Closed',
    severity: 'info',
    color: 'text-blue-500',
  },
  copy_attempt: {
    icon: <Copy className="w-4 h-4" />,
    label: 'Copy Attempt Blocked',
    severity: 'warning',
    color: 'text-yellow-500',
  },
  screenshot_attempt: {
    icon: <Monitor className="w-4 h-4" />,
    label: 'Screenshot Detected',
    severity: 'error',
    color: 'text-red-500',
  },
  print_attempt: {
    icon: <Printer className="w-4 h-4" />,
    label: 'Print Attempt',
    severity: 'warning',
    color: 'text-yellow-500',
  },
  download_attempt: {
    icon: <Download className="w-4 h-4" />,
    label: 'Download Attempt',
    severity: 'warning',
    color: 'text-yellow-500',
  },
  context_menu_blocked: {
    icon: <Shield className="w-4 h-4" />,
    label: 'Context Menu Blocked',
    severity: 'info',
    color: 'text-blue-500',
  },
  dev_tools_detected: {
    icon: <AlertTriangle className="w-4 h-4" />,
    label: 'DevTools Detected',
    severity: 'error',
    color: 'text-red-500',
  },
  visibility_changed: {
    icon: <Eye className="w-4 h-4" />,
    label: 'Tab Visibility Changed',
    severity: 'warning',
    color: 'text-yellow-500',
  },
  session_expired: {
    icon: <Clock className="w-4 h-4" />,
    label: 'Session Expired',
    severity: 'error',
    color: 'text-red-500',
  },
};

export const AuditTrailViewer: React.FC<AuditTrailViewerProps> = ({
  events,
  className,
  onClear,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<Set<SecurityEventType>>(
    new Set(Object.keys(EVENT_CONFIG) as SecurityEventType[])
  );

  const filteredEvents = useMemo(() => {
    return events
      .filter(e => selectedTypes.has(e.type))
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [events, selectedTypes]);

  const stats = useMemo(() => {
    const counts = {
      total: events.length,
      warnings: 0,
      errors: 0,
    };
    events.forEach(e => {
      const config = EVENT_CONFIG[e.type];
      if (config.severity === 'warning') counts.warnings++;
      if (config.severity === 'error') counts.errors++;
    });
    return counts;
  }, [events]);

  const toggleType = (type: SecurityEventType) => {
    const newSet = new Set(selectedTypes);
    if (newSet.has(type)) {
      newSet.delete(type);
    } else {
      newSet.add(type);
    }
    setSelectedTypes(newSet);
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatMetadata = (metadata?: Record<string, unknown>) => {
    if (!metadata) return null;
    return Object.entries(metadata)
      .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
      .join(', ');
  };

  // Export to CSV
  const handleExportCSV = useCallback(() => {
    const headers = ['Timestamp', 'Type', 'Session ID', 'File ID', 'Metadata'];
    const rows = filteredEvents.map(event => [
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
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit-trail-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('Audit trail exported to CSV');
  }, [filteredEvents]);

  // Export to JSON
  const handleExportJSON = useCallback(() => {
    const jsonContent = JSON.stringify(filteredEvents, null, 2);
    
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit-trail-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('Audit trail exported to JSON');
  }, [filteredEvents]);

  if (events.length === 0) {
    return null;
  }

  return (
    <div className={cn('fixed bottom-20 left-4 z-50', className)}>
      {/* Collapsed view */}
      {!isExpanded && (
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => setIsExpanded(true)}
          className="glass px-4 py-2 rounded-full flex items-center gap-2 hover:bg-secondary/50 transition-colors"
        >
          <Activity className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">{stats.total} Events</span>
          {stats.errors > 0 && (
            <Badge variant="destructive" className="text-xs px-1.5">
              {stats.errors}
            </Badge>
          )}
          {stats.warnings > 0 && (
            <Badge variant="outline" className="text-xs px-1.5 border-yellow-500 text-yellow-500">
              {stats.warnings}
            </Badge>
          )}
          <ChevronUp className="w-4 h-4" />
        </motion.button>
      )}

      {/* Expanded view */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: 20, height: 0 }}
            className="glass rounded-xl w-96 overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">Security Audit Trail</h3>
              </div>
              <div className="flex items-center gap-1">
                {/* Export */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <FileDown className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleExportCSV}>
                      <Download className="w-4 h-4 mr-2" />
                      Export CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportJSON}>
                      <FileText className="w-4 h-4 mr-2" />
                      Export JSON
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Filter */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <Filter className="w-4 h-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56" align="end">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Filter Events</h4>
                      {(Object.entries(EVENT_CONFIG) as [SecurityEventType, EventTypeConfig][]).map(
                        ([type, config]) => (
                          <div key={type} className="flex items-center gap-2">
                            <Checkbox
                              id={type}
                              checked={selectedTypes.has(type)}
                              onCheckedChange={() => toggleType(type)}
                            />
                            <Label
                              htmlFor={type}
                              className={cn('text-xs cursor-pointer', config.color)}
                            >
                              {config.label}
                            </Label>
                          </div>
                        )
                      )}
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Clear */}
                {onClear && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={onClear}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}

                {/* Collapse */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setIsExpanded(false)}
                >
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Stats bar */}
            <div className="px-4 py-2 bg-secondary/30 flex items-center gap-4 text-xs">
              <span className="text-muted-foreground">
                Total: <strong>{stats.total}</strong>
              </span>
              <span className="text-yellow-500">
                Warnings: <strong>{stats.warnings}</strong>
              </span>
              <span className="text-red-500">
                Alerts: <strong>{stats.errors}</strong>
              </span>
            </div>

            {/* Events list */}
            <ScrollArea className="h-64">
              <div className="p-2 space-y-1">
                {filteredEvents.map((event, index) => {
                  const config = EVENT_CONFIG[event.type];
                  return (
                    <motion.div
                      key={`${event.timestamp}-${index}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className={cn(
                        'p-2 rounded-lg flex items-start gap-2 text-sm',
                        config.severity === 'error' && 'bg-red-500/10',
                        config.severity === 'warning' && 'bg-yellow-500/10',
                        config.severity === 'info' && 'bg-secondary/50'
                      )}
                    >
                      <div className={cn('mt-0.5', config.color)}>{config.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className={cn('font-medium', config.color)}>
                            {config.label}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatTime(event.timestamp)}
                          </span>
                        </div>
                        {event.metadata && (
                          <p className="text-xs text-muted-foreground truncate">
                            {formatMetadata(event.metadata)}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground/60">
                          Session: {event.sessionId.slice(0, 12)}...
                        </p>
                      </div>
                    </motion.div>
                  );
                })}

                {filteredEvents.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No events match the current filter
                  </div>
                )}
              </div>
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
