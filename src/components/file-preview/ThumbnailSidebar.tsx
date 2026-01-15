import React, { useEffect, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface ThumbnailSidebarProps {
	pdfUrl?: string;
	slides?: { title: string; content: string[] }[];
	totalPages: number;
	currentPage: number;
	onPageChange: (page: number) => void;
	type: 'pdf' | 'presentation';
}

export const ThumbnailSidebar: React.FC<ThumbnailSidebarProps> = ({
	pdfUrl,
	slides,
	totalPages,
	currentPage,
	onPageChange,
	type,
}) => {
	const [loadedThumbnails, setLoadedThumbnails] = useState<Set<number>>(new Set());
	const containerRef = React.useRef<HTMLDivElement | null>(null);

	// Lazy-load thumbnails as they enter the visible area to avoid rendering all pages at once
	useEffect(() => {
		if (!containerRef.current || !pdfUrl) return;

		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					const el = entry.target as HTMLElement;
					const page = Number(el.dataset.page);
					if (entry.isIntersecting) {
						setLoadedThumbnails((prev) => (prev.has(page) ? prev : new Set(prev).add(page)));
					}
				});
			},
			{ root: containerRef.current, rootMargin: '200px', threshold: 0.1 }
		);

		const buttons = containerRef.current.querySelectorAll('[data-page]');
		buttons.forEach((b) => observer.observe(b));

		return () => observer.disconnect();
	}, [pdfUrl, totalPages]);

	if (totalPages <= 1) return null;

	return (
		<ScrollArea className="w-24 md:w-28 flex-shrink-0 border-r border-border bg-secondary/30">
			<div ref={containerRef} className="p-2 space-y-2">
				{Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
					<motion.button
						key={pageNum}
						data-page={pageNum}
						whileHover={{ scale: 1.03 }}
						whileTap={{ scale: 0.97 }}
						onClick={() => onPageChange(pageNum)}
						className={cn(
							'w-full aspect-[3/4] rounded-lg border-2 transition-all overflow-hidden relative',
							'flex items-center justify-center bg-card',
							currentPage === pageNum
								? 'border-primary ring-2 ring-primary/30'
								: 'border-border hover:border-primary/50'
						)}
					>
						{type === 'pdf' && pdfUrl ? (
							// Only render actual PDF thumbnail page when it has been marked as visible
							loadedThumbnails.has(pageNum) ? (
								<Document file={pdfUrl} loading={null} className="w-full h-full">
									<Page
										pageNumber={pageNum}
										width={80}
										renderTextLayer={false}
										renderAnnotationLayer={false}
										loading={
											<div className="flex items-center justify-center w-full h-full">
												<Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
											</div>
										}
										onRenderSuccess={() => {
											/* intentionally minimal: we only mark loaded when the page actually renders */
										}}
										className="w-full h-full object-contain"
									/>
								</Document>
							) : (
								<div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">{pageNum}</div>
							)
						) : type === 'presentation' && slides ? (
							<div className="w-full h-full p-1 flex flex-col bg-gradient-to-br from-card to-secondary overflow-hidden">
								<div className="text-[6px] font-bold text-foreground truncate">{slides[pageNum - 1]?.title || `Slide ${pageNum}`}</div>
								<div className="flex-1 mt-0.5 space-y-0.5 overflow-hidden">
									{slides[pageNum - 1]?.content.slice(0, 3).map((item, i) => (
										<div key={i} className="flex items-start gap-0.5">
											<div className="w-0.5 h-0.5 rounded-full bg-primary mt-0.5 flex-shrink-0" />
											<span className="text-[4px] text-muted-foreground truncate">{item}</span>
										</div>
									))}
								</div>
							</div>
						) : (
							<span className="text-xs font-medium text-muted-foreground">{pageNum}</span>
						)}

						{/* Page number overlay */}
						<div className="absolute bottom-0.5 right-0.5 bg-background/80 px-1 py-0.5 rounded text-[8px] font-medium">{pageNum}</div>
					</motion.button>
				))}
			</div>
		</ScrollArea>
	);
};
