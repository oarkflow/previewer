import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import mammoth from 'mammoth';
import { FileText, AlertCircle } from 'lucide-react';
import { PreviewContext, SearchMatch } from '@/types/file-preview';
import { ScrollArea } from '@/components/ui/scroll-area';
import DOMPurify from 'dompurify';

interface DocumentRendererProps {
    ctx: PreviewContext;
}

export const DocumentRenderer: React.FC<DocumentRendererProps> = ({ ctx }) => {
    const [htmlContent, setHtmlContent] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const [initialFitApplied, setInitialFitApplied] = useState(false);

    const sanitizerConfig = useMemo(() => ({
        ADD_TAGS: ['mark'],
        FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'link', 'meta', 'style'],
        // Only allow in-document fragment links and in-memory resources.
        // This prevents doc content from pulling remote images/scripts.
        ALLOWED_URI_REGEXP: /^(?:blob:|data:|#)/i,
    }), []);

    const escapeHtml = useCallback((value: string) => {
        return value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');

    }, []);

    useEffect(() => {
        const loadDocument = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const blob = ctx.file.data instanceof Blob
                    ? ctx.file.data
                    : new Blob([ctx.file.data]);
                const arrayBuffer = await blob.arrayBuffer();

                const ext = ctx.file.extension.toLowerCase();

                if (ext === 'docx') {
                    const result = await mammoth.convertToHtml({ arrayBuffer });
                    setHtmlContent(DOMPurify.sanitize(result.value, sanitizerConfig));

                    if (result.messages.length > 0) {
                        console.warn('Document conversion warnings:', result.messages);
                    }
                } else if (ext === 'doc') {
                    setError('Legacy .doc format is not fully supported. Please convert to .docx for best results.');
                } else if (ext === 'rtf') {
                    const text = await blob.text();
                    const safeText = escapeHtml(text);
                    setHtmlContent(DOMPurify.sanitize(`<pre style="white-space: pre-wrap; font-family: inherit;">${safeText}</pre>`, sanitizerConfig));
                } else if (ext === 'odt') {
                    setError('OpenDocument format is not currently supported. Please convert to .docx.');
                } else {
                    setError(`Unsupported document format: .${ext}`);
                }
            } catch (err) {
                console.error('Failed to load document:', err);
                setError('Failed to parse document. The file may be corrupted or in an unsupported format.');
            }

            setIsLoading(false);
        };

        setInitialFitApplied(false);
        loadDocument();
    }, [ctx.file.data, ctx.file.extension, escapeHtml, sanitizerConfig]);

    // Search functionality - find matches in HTML content
    useEffect(() => {
        if (!ctx.searchQuery || !htmlContent) {
            ctx.onSearchMatchesChange([]);
            return;
        }

        // Extract text content from HTML for searching
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;
        const textContent = tempDiv.textContent || tempDiv.innerText || '';

        const query = ctx.searchQuery.toLowerCase();
        const lowerText = textContent.toLowerCase();
        const matches: SearchMatch[] = [];
        let startIndex = 0;
        let matchIndex = 0;

        while (true) {
            const foundIndex = lowerText.indexOf(query, startIndex);
            if (foundIndex === -1) break;

            matches.push({
                pageIndex: 1,
                matchIndex: matchIndex++,
                text: textContent.substring(foundIndex, foundIndex + ctx.searchQuery.length),
            });
            startIndex = foundIndex + 1;
        }

        ctx.onSearchMatchesChange(matches);
        if (matches.length > 0) {
            ctx.onCurrentMatchChange(0);
        }
    }, [ctx.searchQuery, htmlContent]);

    // Highlight search matches in rendered content
    const highlightedContent = useMemo(() => {
        if (!ctx.searchQuery || !htmlContent) return htmlContent;

        const query = ctx.searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${query})`, 'gi');

        // Simple highlighting approach - wrap matches in mark tags
        const withHighlights = htmlContent.replace(regex, '<mark class="search-highlight">$1</mark>');
        return DOMPurify.sanitize(withHighlights, sanitizerConfig);
    }, [htmlContent, ctx.searchQuery, sanitizerConfig]);

    // Scroll to current match
    useEffect(() => {
        if (!ctx.searchQuery || ctx.searchMatches.length === 0 || ctx.currentMatchIndex < 0) return;

        const timer = setTimeout(() => {
            const highlights = contentRef.current?.querySelectorAll('.search-highlight');
            if (highlights && highlights[ctx.currentMatchIndex]) {
                const highlight = highlights[ctx.currentMatchIndex] as HTMLElement;

                // Remove previous current highlight
                highlights.forEach(h => h.classList.remove('current-match'));
                highlight.classList.add('current-match');

                highlight.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 100);

        return () => clearTimeout(timer);
    }, [ctx.currentMatchIndex, ctx.searchQuery, ctx.searchMatches.length]);

    // apply fit-to-viewport after content is rendered
    useEffect(() => {
        if (isLoading || initialFitApplied) return;
        if (!containerRef.current || !contentRef.current) return;

        const contRect = containerRef.current.getBoundingClientRect();
        const contentRect = contentRef.current.getBoundingClientRect();

        const fitScale = Math.min(1, (contRect.width * 0.95) / Math.max(1, contentRect.width), (contRect.height * 0.95) / Math.max(1, contentRect.height));

        if (!isNaN(fitScale) && fitScale > 0) {
            ctx.onZoomChange(fitScale);
            setInitialFitApplied(true);
        }
    }, [isLoading, htmlContent, initialFitApplied, ctx]);

    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        const newZoom = Math.max(0.25, Math.min(3, ctx.zoom + delta));
        ctx.onZoomChange(newZoom);
    }, [ctx]);

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-preview-bg">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                    <p className="text-muted-foreground">Converting document...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex-1 flex items-center justify-center bg-preview-bg p-8">
                <div className="text-center max-w-md">
                    <AlertCircle className="w-16 h-16 text-warning mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">Document Preview Limited</h3>
                    <p className="text-muted-foreground">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            ref={containerRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex justify-center bg-preview-bg p-6 overflow-auto"
            onWheel={handleWheel}
        >
            <div
                className="w-full max-w-3xl max-h-full bg-white text-gray-900 rounded-lg shadow-heavy"
                style={{
                    transform: `scale(${ctx.zoom})`,
                    transformOrigin: 'top center',
                }}
            >
                <ScrollArea className="h-[calc(100vh-200px)]">
                    <div ref={contentRef} className="p-8 md:p-12">
                        <style>{`
              .document-content {
                font-family: 'Georgia', serif;
                font-size: 16px;
                line-height: 1.8;
              }
              .document-content h1 {
                font-size: 2em;
                font-weight: bold;
                margin: 1em 0 0.5em;
                color: #111;
              }
              .document-content h2 {
                font-size: 1.5em;
                font-weight: bold;
                margin: 1em 0 0.5em;
                color: #222;
              }
              .document-content h3 {
                font-size: 1.25em;
                font-weight: bold;
                margin: 1em 0 0.5em;
                color: #333;
              }
              .document-content p {
                margin: 0.5em 0;
              }
              .document-content ul, .document-content ol {
                margin: 0.5em 0;
                padding-left: 2em;
              }
              .document-content li {
                margin: 0.25em 0;
              }
              .document-content table {
                border-collapse: collapse;
                margin: 1em 0;
                width: 100%;
              }
              .document-content th, .document-content td {
                border: 1px solid #ccc;
                padding: 0.5em;
                text-align: left;
              }
              .document-content th {
                background: #f5f5f5;
                font-weight: bold;
              }
              .document-content img {
                max-width: 100%;
                height: auto;
                margin: 1em 0;
              }
              .document-content strong, .document-content b {
                font-weight: bold;
              }
              .document-content em, .document-content i {
                font-style: italic;
              }
              .document-content a {
                color: #0066cc;
                text-decoration: underline;
              }
              .search-highlight {
                background-color: rgba(250, 204, 21, 0.6);
                padding: 0 2px;
                border-radius: 2px;
              }
              .search-highlight.current-match {
                background-color: rgba(249, 115, 22, 0.8);
                color: white;
              }
            `}</style>
                        <div
                            className="document-content"
                            dangerouslySetInnerHTML={{ __html: highlightedContent }}
                        />
                    </div>
                </ScrollArea>

                {/* Search match indicator */}
                {ctx.searchQuery && ctx.searchMatches.length > 0 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background/90 px-3 py-1.5 rounded-full text-sm text-muted-foreground shadow">
                        Match {ctx.currentMatchIndex + 1} of {ctx.searchMatches.length}
                    </div>
                )}
            </div>
        </motion.div>
    );
};
