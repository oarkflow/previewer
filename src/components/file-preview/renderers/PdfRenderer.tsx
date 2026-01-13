import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { PreviewContext, SearchMatch } from '@/types/file-preview';
import { ThumbnailSidebar } from '../ThumbnailSidebar';
import { cn } from '@/lib/utils';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.mjs';

interface PdfRendererProps {
    ctx: PreviewContext;
}

export const PdfRenderer: React.FC<PdfRendererProps> = ({ ctx }) => {
    const [pdfUrl, setPdfUrl] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const pageRef = useRef<HTMLDivElement>(null);
    const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
    const [pdfDocument, setPdfDocument] = useState<any>(null);
    const [pageTextContents, setPageTextContents] = useState<Map<number, string>>(new Map());
    const highlightLayerRef = useRef<HTMLDivElement>(null);
    const dragStartRef = useRef({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const blob = ctx.file.data instanceof Blob
            ? ctx.file.data
            : new Blob([ctx.file.data], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);

        return () => {
            URL.revokeObjectURL(url);
        };
    }, [ctx.file.data]);

    useEffect(() => {
        const updateSize = () => {
            if (containerRef.current) {
                setContainerSize({
                    width: containerRef.current.clientWidth - 48,
                    height: containerRef.current.clientHeight - 48,
                });
            }
        };

        updateSize();
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, []);

    // Extract text from all pages for searching
    const extractTextFromPage = useCallback(async (pdf: any, pageNum: number): Promise<string> => {
        try {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();
            const text = textContent.items.map((item: any) => item.str).join(' ');
            return text;
        } catch {
            return '';
        }
    }, []);

    // Load all page text when document loads
    useEffect(() => {
        if (!pdfDocument) return;

        const loadAllText = async () => {
            const textMap = new Map<number, string>();
            for (let i = 1; i <= pdfDocument.numPages; i++) {
                const text = await extractTextFromPage(pdfDocument, i);
                textMap.set(i, text);
            }
            setPageTextContents(textMap);
        };

        loadAllText();
    }, [pdfDocument, extractTextFromPage]);

    // Search functionality
    useEffect(() => {
        if (!ctx.searchQuery || pageTextContents.size === 0) {
            ctx.onSearchMatchesChange([]);
            return;
        }

        const query = ctx.searchQuery.toLowerCase();
        const matches: SearchMatch[] = [];

        pageTextContents.forEach((text, pageNum) => {
            const lowerText = text.toLowerCase();
            let startIndex = 0;
            let matchIndex = 0;

            while (true) {
                const foundIndex = lowerText.indexOf(query, startIndex);
                if (foundIndex === -1) break;

                matches.push({
                    pageIndex: pageNum,
                    matchIndex: matchIndex++,
                    text: text.substring(foundIndex, foundIndex + ctx.searchQuery.length),
                });
                startIndex = foundIndex + 1;
            }
        });

        ctx.onSearchMatchesChange(matches);
        if (matches.length > 0) {
            ctx.onCurrentMatchChange(0);
        }
    }, [ctx.searchQuery, pageTextContents]);

    // Navigate to current match
    useEffect(() => {
        if (ctx.searchMatches.length === 0 || ctx.currentMatchIndex < 0) return;

        const match = ctx.searchMatches[ctx.currentMatchIndex];
        if (match && match.pageIndex !== ctx.page) {
            ctx.onPageChange(match.pageIndex);
        }
    }, [ctx.currentMatchIndex, ctx.searchMatches]);

    // Apply text layer highlighting
    useEffect(() => {
        if (!ctx.searchQuery) return;

        // Use a small delay to ensure text layer is rendered
        const timer = setTimeout(() => {
            const textLayer = document.querySelector('.react-pdf__Page__textContent');
            if (!textLayer) return;

            const spans = textLayer.querySelectorAll('span');
            const query = ctx.searchQuery.toLowerCase();

            spans.forEach((span) => {
                const originalText = span.textContent || '';
                const lowerText = originalText.toLowerCase();

                if (lowerText.includes(query)) {
                    // Highlight matching text by wrapping in mark elements
                    const regex = new RegExp(`(${ctx.searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
                    span.innerHTML = originalText.replace(regex, '<mark class="bg-yellow-400/80 text-black rounded px-0.5">$1</mark>');
                }
            });
        }, 100);

        return () => clearTimeout(timer);
    }, [ctx.searchQuery, ctx.page]);

    const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
        ctx.onTotalPagesChange(numPages);
        setIsLoading(false);

        if (containerRef.current) {
            const contWidth = containerRef.current.clientWidth - 160; // Account for thumbnail sidebar
            const contHeight = containerRef.current.clientHeight - 48;
            const basePageWidth = Math.min(contWidth * 0.9, 800);
            const fitScale = Math.min(1, (contWidth * 0.95) / basePageWidth, (contHeight * 0.95) / (basePageWidth * 1.3));
            if (!isNaN(fitScale) && fitScale > 0) {
                ctx.onZoomChange(fitScale);
            }
        }
    }, [ctx.onTotalPagesChange, ctx.onZoomChange]);

    const onDocumentLoadError = useCallback((error: Error) => {
        console.error('PDF load error:', error);
        setError('Failed to load PDF. The file may be corrupted or password protected.');
        setIsLoading(false);
    }, []);

    const handlePdfLoad = useCallback((pdf: any) => {
        setPdfDocument(pdf);
    }, []);

    const pageWidth = Math.min(containerSize.width * 0.9 - 100, 700);

    const pageTransform = useMemo(() => {
        const transforms: string[] = [];
        if (position.x !== 0 || position.y !== 0) {
            transforms.push(`translate(${position.x}px, ${position.y}px)`);
        }
        if (ctx.rotation) {
            transforms.push(`rotate(${ctx.rotation}deg)`);
        }

        return transforms.length > 0 ? transforms.join(' ') : undefined;
    }, [position.x, position.y, ctx.rotation]);

    const handlePointerDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (ctx.zoom <= 1 || e.button !== 0) {
            return;
        }

        e.preventDefault();
        dragStartRef.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y,
        };
        setIsDragging(true);
    }, [ctx.zoom, position.x, position.y]);

    const handlePointerMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!isDragging || ctx.zoom <= 1) {
            return;
        }

        e.preventDefault();
        setPosition({
            x: e.clientX - dragStartRef.current.x,
            y: e.clientY - dragStartRef.current.y,
        });
    }, [isDragging, ctx.zoom]);

    const handlePointerUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    useEffect(() => {
        const handleWindowUp = () => setIsDragging(false);
        window.addEventListener('mouseup', handleWindowUp);
        return () => window.removeEventListener('mouseup', handleWindowUp);
    }, []);

    useEffect(() => {
        setPosition({ x: 0, y: 0 });
    }, [ctx.page, ctx.rotation]);

    useEffect(() => {
        if (ctx.zoom <= 1) {
            setPosition({ x: 0, y: 0 });
        }
    }, [ctx.zoom]);

    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        const newZoom = Math.max(0.25, Math.min(3, ctx.zoom + delta));
        ctx.onZoomChange(newZoom);
    }, [ctx]);

    if (!pdfUrl) {
        return (
            <div className="flex-1 flex items-center justify-center bg-preview-bg">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex-1 flex items-center justify-center bg-preview-bg p-8">
                <div className="text-center max-w-md">
                    <p className="text-destructive">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            ref={containerRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex bg-preview-bg overflow-hidden"
        >
            {/* Thumbnail Sidebar */}
            <ThumbnailSidebar
                pdfUrl={pdfUrl}
                totalPages={ctx.totalPages}
                currentPage={ctx.page}
                onPageChange={ctx.onPageChange}
                type="pdf"
            />

            {/* Main PDF View */}
            <div
                className={cn(
                    'flex-1 flex flex-col overflow-auto p-6 scrollbar-thin',
                    ctx.zoom > 1 ? 'cursor-grab' : 'cursor-default',
                    isDragging && 'cursor-grabbing'
                )}
                onMouseDown={handlePointerDown}
                onMouseMove={handlePointerMove}
                onMouseUp={handlePointerUp}
                onMouseLeave={handlePointerUp}
                onWheel={handleWheel}
            >
                <div className="min-h-full flex flex-col items-center justify-start">
                    <Document
                        file={pdfUrl}
                        onLoadSuccess={(pdf) => {
                            onDocumentLoadSuccess(pdf);
                            handlePdfLoad(pdf);
                        }}
                        onLoadError={onDocumentLoadError}
                        loading={
                            <div className="flex items-center gap-2">
                                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                <span className="text-muted-foreground">Loading PDF...</span>
                            </div>
                        }
                        className="flex flex-col items-center"
                    >
                        <motion.div
                            ref={pageRef}
                            key={ctx.page}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center justify-center relative"
                            style={{
                                transform: pageTransform,
                                transformOrigin: 'center center',
                            }}
                        >
                            <Page
                                pageNumber={ctx.page}
                                width={Math.max(1, Math.round(pageWidth * ctx.zoom))}
                                renderTextLayer={true}
                                renderAnnotationLayer={true}
                                className="shadow-heavy rounded-lg overflow-hidden"
                                loading={
                                    <div className="w-full h-[600px] bg-card animate-pulse rounded-lg flex items-center justify-center">
                                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                    </div>
                                }
                            />
                        </motion.div>
                    </Document>
                </div>

                {/* Search match indicator */}
                {ctx.searchQuery && ctx.searchMatches.length > 0 && (
                    <div className="mt-4 text-sm text-muted-foreground">
                        Match {ctx.currentMatchIndex + 1} of {ctx.searchMatches.length}
                        {ctx.searchMatches[ctx.currentMatchIndex]?.pageIndex !== ctx.page && (
                            <span className="ml-2 text-primary">
                                (on page {ctx.searchMatches[ctx.currentMatchIndex]?.pageIndex})
                            </span>
                        )}
                    </div>
                )}
            </div>
        </motion.div>
    );
};
