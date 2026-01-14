import React, { useState, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileMeta,
    getFileCategory,
    PreviewContext,
    SearchMatch
} from '@/types/file-preview';
import { SecurityConfig, MAX_SECURITY_CONFIG, SecurityEvent, SecurityEventType } from '@/types/security';
import { PreviewToolbar } from './PreviewToolbar';
import { ImageRenderer } from './renderers/ImageRenderer';
import { AudioRenderer } from './renderers/AudioRenderer';
import { VideoRenderer } from './renderers/VideoRenderer';
import { TextRenderer } from './renderers/TextRenderer';
import { SpreadsheetRenderer } from './renderers/SpreadsheetRenderer';
import { DocumentRenderer } from './renderers/DocumentRenderer';
import { PresentationRenderer } from './renderers/PresentationRenderer';
import { BinaryRenderer } from './renderers/BinaryRenderer';
import { PdfRenderer } from './renderers/PdfRenderer';
import { FolderRenderer } from './renderers/FolderRenderer';
import { FileHistory } from './FileHistory';
import { SecurityOverlay } from './SecurityOverlay';
import { SecuritySettings } from './SecuritySettings';
import { AuditTrailViewer } from './AuditTrailViewer';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { useFileHistory } from '@/hooks/use-file-history';
import { useSecurity } from '@/hooks/use-security';
import { useDeviceFingerprint } from '@/hooks/use-device-fingerprint';
import { useSessionValidation } from '@/hooks/use-session-validation';
import { toast } from 'sonner';

interface FilePreviewerProps {
    file: FileMeta;
    onClose: () => void;
    onSelectHistoryFile?: (id: string) => void;
    initialSecurityConfig?: SecurityConfig;
}

export const FilePreviewer: React.FC<FilePreviewerProps> = ({
    file,
    onClose,
    onSelectHistoryFile,
    // Use MAX_SECURITY_CONFIG by default for maximum protection
    initialSecurityConfig = MAX_SECURITY_CONFIG
}) => {
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchMatches, setSearchMatches] = useState<SearchMatch[]>([]);
    const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [securityConfig, setSecurityConfig] = useState<SecurityConfig>(initialSecurityConfig || MAX_SECURITY_CONFIG);
    const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
    const [showAuditTrail, setShowAuditTrail] = useState(true);
    const printRef = useRef<HTMLDivElement>(null);

    const { history, addToHistory, removeFromHistory, clearHistory, getFileFromHistory, togglePin, reorderHistory } = useFileHistory();

    // Device fingerprinting for session security
    const { fingerprint, isReady: fingerprintReady } = useDeviceFingerprint();

    // Security violation handler
    const handleSecurityViolation = useCallback((type: SecurityEventType, message: string) => {
        toast.error(message, {
            icon: '🔒',
            duration: 3000,
        });
    }, []);

    // Apply security measures with enhanced protection
    const { sessionId, logEvent, devToolsOpen, isBlurred } = useSecurity({
        config: securityConfig,
        fileId: file.name,
        onSecurityEvent: (event) => {
            // Add event to local audit trail
            setSecurityEvents(prev => [...prev, event]);
            console.debug('[Security]', event.type, event);
        },
        onSecurityViolation: handleSecurityViolation,
    });

    // Periodic session validation with device fingerprint
    const { isValid: sessionValid, lastValidation, expiresAt } = useSessionValidation({
        sessionId,
        fingerprint,
        fileId: file.name,
        intervalMs: 30000,
        enabled: fingerprintReady && !!sessionId,
        onSessionInvalid: (reason) => {
            console.error('[Session] Invalid:', reason);
            // Could trigger session termination or alert
            logEvent('session_expired', { reason });
        },
        onSessionEvent: (event) => {
            console.debug('[SessionValidation]', event.type, event.details);
        },
    });

    // Clear security events
    const handleClearEvents = useCallback(() => {
        setSecurityEvents([]);
    }, []);


    const fileCategory = useMemo(() => getFileCategory(file.extension, file.type, file.isFolder), [file]);

    const previewContext: PreviewContext = useMemo(() => ({
        file,
        zoom,
        rotation,
        page,
        totalPages,
        searchQuery,
        searchMatches,
        currentMatchIndex,
        onZoomChange: setZoom,
        onRotationChange: setRotation,
        onPageChange: setPage,
        onTotalPagesChange: setTotalPages,
        onSearchMatchesChange: setSearchMatches,
        onCurrentMatchChange: setCurrentMatchIndex,
    }), [file, zoom, rotation, page, totalPages, searchQuery, searchMatches, currentMatchIndex]);

    const handleZoomIn = useCallback(() => {
        setZoom(prev => {
            const next = Math.min(prev + 0.25, 3);
            console.debug('handleZoomIn', { prev, next });
            return next;
        });
    }, []);

    const handleZoomOut = useCallback(() => {
        setZoom(prev => {
            const next = Math.max(prev - 0.25, 0.25);
            console.debug('handleZoomOut', { prev, next });
            return next;
        });
    }, []);

    const handleResetZoom = useCallback(() => {
        setZoom(1);
        setRotation(0);
    }, []);

    const handleRotateLeft = useCallback(() => {
        setRotation(prev => (prev - 90) % 360);
    }, []);

    const handleRotateRight = useCallback(() => {
        setRotation(prev => (prev + 90) % 360);
    }, []);

    const handlePrevPage = useCallback(() => {
        setPage(prev => Math.max(prev - 1, 1));
    }, []);

    const handleNextPage = useCallback(() => {
        setPage(prev => Math.min(prev + 1, totalPages));
    }, [totalPages]);

    const handlePrevSearchMatch = useCallback(() => {
        setCurrentMatchIndex(prev => prev > 0 ? prev - 1 : searchMatches.length - 1);
    }, [searchMatches.length]);

    const handleNextSearchMatch = useCallback(() => {
        setCurrentMatchIndex(prev => prev < searchMatches.length - 1 ? prev + 1 : 0);
    }, [searchMatches.length]);

    const handleDownload = useCallback(() => {
        // Check if download is blocked
        if (securityConfig.noDownload) {
            logEvent('download_attempt', { blocked: true });
            return;
        }

        logEvent('download_attempt', { blocked: false });

        if (file.url) {
            // For URL-based files, open in new tab or download
            const a = document.createElement('a');
            a.href = file.url;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.download = file.name;
            a.click();
        } else {
            // For local files, create blob URL
            const blob = file.data instanceof Blob
                ? file.data
                : new Blob([file.data]);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = file.name;
            a.click();
            URL.revokeObjectURL(url);
        }
    }, [file, securityConfig.noDownload, logEvent]);

    const handlePrint = useCallback(() => {
        // Check if print is blocked (part of screenshot resistance)
        if (securityConfig.screenshotResistant) {
            logEvent('print_attempt', { blocked: true });
            return;
        }

        logEvent('print_attempt', { blocked: false });

        // Create a print window for PDFs and documents
        const blob = file.data instanceof Blob
            ? file.data
            : new Blob([file.data], { type: file.type || 'application/octet-stream' });
        const url = URL.createObjectURL(blob);

        // For PDFs, open in new window and print
        if (fileCategory === 'pdf') {
            const printWindow = window.open(url, '_blank');
            if (printWindow) {
                printWindow.onload = () => {
                    printWindow.print();
                };
            }
        } else if (fileCategory === 'document' || fileCategory === 'image') {
            // For documents and images, use the current content
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Print - ${file.name}</title>
            <style>
              body { margin: 0; padding: 20px; font-family: system-ui, sans-serif; }
              img { max-width: 100%; height: auto; }
              .content { max-width: 800px; margin: 0 auto; }
              @media print {
                body { padding: 0; }
              }
            </style>
          </head>
          <body>
            <div class="content" id="print-content">
              ${fileCategory === 'image'
                        ? `<img src="${url}" alt="${file.name}" />`
                        : '<div id="doc-content">Loading...</div>'
                    }
            </div>
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                  window.close();
                }, 500);
              };
            </script>
          </body>
          </html>
        `);
                printWindow.document.close();
            }
        } else {
            // Fallback: trigger browser print dialog
            window.print();
        }

        // Cleanup blob URL after a delay
        setTimeout(() => URL.revokeObjectURL(url), 5000);
    }, [file, fileCategory, securityConfig.screenshotResistant, logEvent]);

    const handleFullscreen = useCallback(() => {
        const elem = document.documentElement;
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            elem.requestFullscreen();
        }
    }, []);

    // Determine toolbar options based on file category
    const toolbarConfig = useMemo(() => {
        switch (fileCategory) {
            case 'pdf':
                return { showZoom: true, showRotation: true, showPagination: true, showSearch: true, showPrint: true };
            case 'image':
                return { showZoom: true, showRotation: true, showPagination: false, showSearch: false, showPrint: true };
            case 'presentation':
                return { showZoom: true, showRotation: false, showPagination: true, showSearch: false, showPrint: false };
            case 'code':
            case 'text':
                return { showZoom: false, showRotation: false, showPagination: false, showSearch: true, showPrint: false };
            case 'document':
                return { showZoom: true, showRotation: false, showPagination: false, showSearch: true, showPrint: true };
            case 'folder':
                return { showZoom: false, showRotation: false, showPagination: false, showSearch: false, showPrint: false };
            default:
                return { showZoom: false, showRotation: false, showPagination: false, showSearch: false, showPrint: false };
        }
    }, [fileCategory]);

    // Keyboard shortcuts
    useKeyboardShortcuts({
        onZoomIn: toolbarConfig.showZoom ? handleZoomIn : undefined,
        onZoomOut: toolbarConfig.showZoom ? handleZoomOut : undefined,
        onRotateLeft: toolbarConfig.showRotation ? handleRotateLeft : undefined,
        onRotateRight: toolbarConfig.showRotation ? handleRotateRight : undefined,
        onNextPage: toolbarConfig.showPagination ? handleNextPage : undefined,
        onPrevPage: toolbarConfig.showPagination ? handlePrevPage : undefined,
        onClose,
        onFullscreen: handleFullscreen,
        onDownload: handleDownload,
        enabled: true,
    });

    // Render the appropriate preview component
    const renderPreview = () => {
        switch (fileCategory) {
            case 'pdf':
                return <PdfRenderer ctx={previewContext} />;
            case 'image':
                return <ImageRenderer ctx={previewContext} />;
            case 'audio':
                return <AudioRenderer ctx={previewContext} />;
            case 'video':
                return <VideoRenderer ctx={previewContext} />;
            case 'code':
                return <TextRenderer ctx={previewContext} isCode={true} />;
            case 'text':
                return <TextRenderer ctx={previewContext} isCode={false} />;
            case 'spreadsheet':
                return <SpreadsheetRenderer ctx={previewContext} />;
            case 'document':
                return <DocumentRenderer ctx={previewContext} />;
            case 'presentation':
                return <PresentationRenderer ctx={previewContext} />;
            case 'folder':
                return <FolderRenderer ctx={previewContext} />;
            case 'binary':
            default:
                return <BinaryRenderer ctx={previewContext} />;
        }
    };

    const handleSelectHistoryFile = useCallback((id: string) => {
        if (onSelectHistoryFile) {
            onSelectHistoryFile(id);
        }
    }, [onSelectHistoryFile]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col bg-background"
        >
            {/* File History Sidebar */}
            <FileHistory
                history={history}
                isOpen={isHistoryOpen}
                onToggle={() => setIsHistoryOpen(!isHistoryOpen)}
                onSelectFile={handleSelectHistoryFile}
                onRemoveFile={removeFromHistory}
                onClearHistory={clearHistory}
                onTogglePin={togglePin}
                onReorder={reorderHistory}
            />

            {/* Toolbar */}
            <div className="flex-shrink-0 p-2 border-b border-border">
                <PreviewToolbar
                    fileName={file.name}
                    fileSize={file.size}
                    fileCategory={fileCategory}
                    zoom={zoom}
                    rotation={rotation}
                    currentPage={page}
                    totalPages={totalPages}
                    searchQuery={searchQuery}
                    searchMatchCount={searchMatches.length}
                    currentSearchMatch={currentMatchIndex + 1}
                    onZoomIn={handleZoomIn}
                    onZoomOut={handleZoomOut}
                    onResetZoom={handleResetZoom}
                    onRotateLeft={handleRotateLeft}
                    onRotateRight={handleRotateRight}
                    onPrevPage={handlePrevPage}
                    onNextPage={handleNextPage}
                    onSearchChange={setSearchQuery}
                    onPrevSearchMatch={handlePrevSearchMatch}
                    onNextSearchMatch={handleNextSearchMatch}
                    onDownload={handleDownload}
                    onPrint={handlePrint}
                    onClose={onClose}
                    onFullscreen={handleFullscreen}
                    showDownload={!securityConfig.noDownload}
                    showPrint={toolbarConfig.showPrint && !securityConfig.screenshotResistant}
                    showZoom={toolbarConfig.showZoom}
                    showRotation={toolbarConfig.showRotation}
                    showPagination={toolbarConfig.showPagination}
                    showSearch={toolbarConfig.showSearch}
                />
            </div>

            {/* Preview area with security overlay */}
            <SecurityOverlay
                config={securityConfig}
                className="flex-1 min-h-0 relative flex flex-col overflow-hidden"
                devToolsBlocked={devToolsOpen}
                isBlurred={isBlurred}
            >
                <div ref={printRef} className="flex-1 min-h-0 flex flex-col">
                    <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                            key={`${file.name}-${file.lastModified ?? file.size}-${fileCategory}`}
                            className="flex-1 min-h-0 flex flex-col"
                        >
                            {renderPreview()}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </SecurityOverlay>

            {/* Keyboard shortcuts hint */}
            <div className="absolute bottom-4 right-4 glass px-3 py-2 rounded-lg text-xs text-muted-foreground opacity-60 hover:opacity-100 transition-opacity">
                <span className="font-medium">Shortcuts:</span> Esc close • ←→ pages • +/- zoom • wheel zoom • P print • F fullscreen
            </div>

            {/* Session info tooltip */}
            {lastValidation && (
                <div className="absolute top-16 left-4 glass px-3 py-1.5 rounded-lg text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <span>Session: {sessionId.slice(0, 8)}...</span>
                        {expiresAt && (
                            <span className="text-muted-foreground/60">
                                Expires: {expiresAt.toLocaleTimeString()}
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Audit Trail Viewer */}
            {showAuditTrail && (
                <AuditTrailViewer
                    events={securityEvents}
                    onClear={handleClearEvents}
                />
            )}
        </motion.div>
    );
};
