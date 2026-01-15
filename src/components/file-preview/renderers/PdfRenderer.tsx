import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { PreviewContext, SearchMatch } from '@/types/file-preview';
import { ThumbnailSidebar } from '../ThumbnailSidebar';
import { cn } from '@/lib/utils';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';

// Set up PDF.js worker - try local first, fall back to CDN
// Use absolute path with base URL to avoid Vite trying to process it as a module
const localWorkerUrl = `${window.location.origin}/pdf.worker.mjs`;
const cdnWorkerUrl = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

// Check if local worker exists, otherwise use CDN
fetch(localWorkerUrl, { method: 'HEAD' })
	.then(() => {
		pdfjs.GlobalWorkerOptions.workerSrc = localWorkerUrl;
	})
	.catch(() => {
		console.warn('Local PDF worker not found, using CDN fallback');
		pdfjs.GlobalWorkerOptions.workerSrc = cdnWorkerUrl;
	});

interface PdfRendererProps {
	ctx: PreviewContext;
}

export const PdfRenderer: React.FC<PdfRendererProps> = ({ ctx }) => {
	const [pdfUrl, setPdfUrl] = useState<string>('');
	const [isLoading, setIsLoading] = useState(true);
	const [loadingProgress, setLoadingProgress] = useState(0);
	const [error, setError] = useState<string | null>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const pageRef = useRef<HTMLDivElement>(null);
	const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
	const [pdfDocument, setPdfDocument] = useState<any>(null);
	const [pageTextContents, setPageTextContents] = useState<Map<number, string>>(new Map());
	const highlightLayerRef = useRef<HTMLDivElement>(null);
	const scrollContainerRef = useRef<HTMLDivElement>(null);
	const dragStartRef = useRef({ x: 0, y: 0, scrollX: 0, scrollY: 0 });
	const [isDragging, setIsDragging] = useState(false);
	const [loadingPages, setLoadingPages] = useState<Set<number>>(new Set());

	// File size warning threshold (20MB)
	const FILE_SIZE_WARNING_THRESHOLD = 20 * 1024 * 1024;
	const fileSize = ctx.file.size || 0;
	const isLargeFile = fileSize > FILE_SIZE_WARNING_THRESHOLD;

	useEffect(() => {
		// For very large files, show warning and prepare for streaming
		if (isLargeFile) {
			console.warn(`Large PDF file detected: ${(fileSize / 1024 / 1024).toFixed(2)}MB`);
		}

		const blob = ctx.file.data instanceof Blob
			? ctx.file.data
			: new Blob([ctx.file.data], { type: 'application/pdf' });

		// Use blob URL for now, but set up for streaming
		const url = URL.createObjectURL(blob);
		setPdfUrl(url);

		return () => {
			URL.revokeObjectURL(url);
		};
	}, [ctx.file.data, fileSize, isLargeFile]);

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

	// Extract text from a page (lazy loading)
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

	// Lazy load text for current page and nearby pages (streaming approach)
	useEffect(() => {
		if (!pdfDocument) return;

		const loadPageText = async (pageNum: number) => {
			if (pageTextContents.has(pageNum) || loadingPages.has(pageNum)) return;

			setLoadingPages(prev => new Set(prev).add(pageNum));
			const text = await extractTextFromPage(pdfDocument, pageNum);
			setPageTextContents(prev => new Map(prev).set(pageNum, text));
			setLoadingPages(prev => {
				const next = new Set(prev);
				next.delete(pageNum);
				return next;
			});
		};

		// Load current page and nearby pages (prefetch)
		// For large files, reduce prefetch range to save memory
		const prefetchRange = isLargeFile ? 1 : 2;
		const pagesToLoad = [
			ctx.page,
			ctx.page - 1,
			ctx.page + 1,
			...(prefetchRange > 1 ? [ctx.page - 2, ctx.page + 2] : []),
		].filter(p => p >= 1 && p <= pdfDocument.numPages);

		pagesToLoad.forEach(loadPageText);
	}, [pdfDocument, ctx.page, extractTextFromPage, pageTextContents, loadingPages, isLargeFile]);

	// Progressive search functionality - searches as pages load
	useEffect(() => {
		if (!ctx.searchQuery) {
			ctx.onSearchMatchesChange([]);
			return;
		}

		if (pageTextContents.size === 0 && !pdfDocument) {
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

		// Sort matches by page number
		matches.sort((a, b) => a.pageIndex - b.pageIndex);

		ctx.onSearchMatchesChange(matches);
		if (matches.length > 0 && ctx.currentMatchIndex < 0) {
			ctx.onCurrentMatchChange(0);
		}

		// If searching and not all pages loaded, trigger background loading
		if (pdfDocument && pageTextContents.size < pdfDocument.numPages) {
			// Load remaining pages in background
			const loadRemainingPages = async () => {
				for (let i = 1; i <= pdfDocument.numPages; i++) {
					if (!pageTextContents.has(i) && !loadingPages.has(i)) {
						setLoadingPages(prev => new Set(prev).add(i));
						const text = await extractTextFromPage(pdfDocument, i);
						setPageTextContents(prev => new Map(prev).set(i, text));
						setLoadingPages(prev => {
							const next = new Set(prev);
							next.delete(i);
							return next;
						});
						// Small delay to avoid blocking UI
						await new Promise(resolve => setTimeout(resolve, 50));
					}
				}
			};
			loadRemainingPages();
		}
	}, [ctx.searchQuery, pageTextContents, pdfDocument, loadingPages, extractTextFromPage]);

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
		setError('Failed to load PDF. The file may be corrupted, password protected, or too large to load.');
		setIsLoading(false);
		setLoadingProgress(0);
	}, []);

	const handlePdfLoad = useCallback((pdf: any) => {
		setPdfDocument(pdf);
		setLoadingProgress(100);
	}, []);

	const pageWidth = Math.min(containerSize.width * 0.9 - 100, 700);

	// Memoize PDF.js options to prevent unnecessary reloads
	const pdfOptions = useMemo(() => ({
		// Enable streaming and chunked loading for large PDFs
		isEvalSupported: false,
		disableAutoFetch: false,
		disableStream: false,
		// Use range requests for better memory management
		disableRange: false,
		// Limit font rendering for performance
		disableFontFace: isLargeFile,
		// Enable text content caching
		useSystemFonts: isLargeFile,
		cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/cmaps/`,
		cMapPacked: true,
		// Add standard font data URL
		standardFontDataUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
	}), [isLargeFile]);

	const pageTransform = useMemo(() => {
		if (ctx.rotation) {
			return `rotate(${ctx.rotation}deg)`;
		}
		return undefined;
	}, [ctx.rotation]);

	const handlePointerDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
		if (ctx.zoom <= 1 || e.button !== 0) {
			return;
		}

		const container = scrollContainerRef.current;
		if (!container) return;

		e.preventDefault();
		dragStartRef.current = {
			x: e.clientX,
			y: e.clientY,
			scrollX: container.scrollLeft,
			scrollY: container.scrollTop,
		};
		setIsDragging(true);
	}, [ctx.zoom]);

	const handlePointerMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
		if (!isDragging || ctx.zoom <= 1) {
			return;
		}

		const container = scrollContainerRef.current;
		if (!container) return;

		e.preventDefault();
		const dx = e.clientX - dragStartRef.current.x;
		const dy = e.clientY - dragStartRef.current.y;

		container.scrollLeft = dragStartRef.current.scrollX - dx;
		container.scrollTop = dragStartRef.current.scrollY - dy;
	}, [isDragging, ctx.zoom]);

	const handlePointerUp = useCallback(() => {
		setIsDragging(false);
	}, []);

	useEffect(() => {
		const handleWindowUp = () => setIsDragging(false);
		window.addEventListener('mouseup', handleWindowUp);
		return () => window.removeEventListener('mouseup', handleWindowUp);
	}, []);

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
			{/* Thumbnail Sidebar - disabled for very large files to save memory */}
			{!isLargeFile && (
				<ThumbnailSidebar
					pdfUrl={pdfUrl}
					totalPages={ctx.totalPages}
					currentPage={ctx.page}
					onPageChange={ctx.onPageChange}
					type="pdf"
				/>
			)}

			{/* Main PDF View */}
			<div
				ref={scrollContainerRef}
				className={cn(
					'flex-1 flex flex-col p-6',
					ctx.zoom > 1 ? 'overflow-auto cursor-grab' : 'overflow-auto cursor-default',
					isDragging && 'cursor-grabbing select-none',
					'scrollbar-thin scrollbar-thumb-secondary scrollbar-track-transparent'
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
						onLoadProgress={({ loaded, total }) => {
							if (total > 0) {
								const progress = Math.round((loaded / total) * 100);
								setLoadingProgress(progress);
							}
						}}
						onLoadError={onDocumentLoadError}
						loading={
							<div className="flex flex-col items-center gap-3">
								<Loader2 className="w-8 h-8 animate-spin text-primary" />
								<div className="text-center">
									<p className="text-muted-foreground">Loading PDF...</p>
									{isLargeFile && (
										<p className="text-xs text-muted-foreground mt-1">
											Large file ({(fileSize / 1024 / 1024).toFixed(1)}MB) - This may take a moment
										</p>
									)}
									{loadingProgress > 0 && loadingProgress < 100 && (
										<div className="mt-2 w-48">
											<div className="h-1.5 bg-secondary rounded-full overflow-hidden">
												<div className="h-full bg-primary transition-all duration-300" style={{ width: `${loadingProgress}%` }} />
											</div>
											<p className="text-xs text-muted-foreground mt-1">{loadingProgress}%</p>
										</div>
									)}
								</div>
							</div>
						}
						className="flex flex-col items-center"
						options={pdfOptions}
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
						{pdfDocument && pageTextContents.size < pdfDocument.numPages && (
							<span className="ml-2 text-xs opacity-70">
								(searching {pageTextContents.size}/{pdfDocument.numPages} pages...)
							</span>
						)}
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
