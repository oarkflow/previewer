import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import * as XLSX from 'xlsx';
import { ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PreviewContext } from '@/types/file-preview';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface PresentationRendererProps {
  ctx: PreviewContext;
}

interface Slide {
  title: string;
  content: string[];
}

export const PresentationRenderer: React.FC<PresentationRendererProps> = ({ ctx }) => {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const slideRef = useRef<HTMLDivElement>(null);
  const [initialFitApplied, setInitialFitApplied] = useState(false);

  // Reset initial fit when the file changes
  useEffect(() => {
    setInitialFitApplied(false);
  }, [ctx.file.name, ctx.file.data]);

  // Apply fit-to-viewport when slide or container changes
  useEffect(() => {
    if (!slideRef.current || !containerRef.current || initialFitApplied) return;
    const contRect = containerRef.current.getBoundingClientRect();
    const slideRect = slideRef.current.getBoundingClientRect();
    const fitScale = Math.min(1, (contRect.width * 0.95) / slideRect.width, (contRect.height * 0.95) / slideRect.height);
    if (!isNaN(fitScale) && fitScale > 0) {
      ctx.onZoomChange(fitScale);
      setInitialFitApplied(true);
    }
  }, [ctx.page, slides.length, initialFitApplied]);

  useEffect(() => {
    const loadPresentation = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const blob = ctx.file.data instanceof Blob
          ? ctx.file.data
          : new Blob([ctx.file.data]);
        const arrayBuffer = await blob.arrayBuffer();

        const ext = ctx.file.extension.toLowerCase();

        if (ext === 'pptx') {
          const workbook = XLSX.read(arrayBuffer, { type: 'array' });

          const extractedSlides: Slide[] = [];

          workbook.SheetNames.forEach((sheetName, index) => {
            const worksheet = workbook.Sheets[sheetName];
            const data = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1 });

            if (data.length > 0) {
              extractedSlides.push({
                title: `Slide ${index + 1}`,
                content: data.flat().filter(item => item && typeof item === 'string'),
              });
            }
          });

          if (extractedSlides.length === 0) {
            extractedSlides.push({
              title: 'PowerPoint Preview',
              content: [
                'Full PPTX rendering requires additional processing.',
                'Text content extraction is available.',
                'For full fidelity, please download the file.',
              ],
            });
          }

          setSlides(extractedSlides);
        } else if (ext === 'ppt') {
          setError('Legacy .ppt format is not supported. Please convert to .pptx for preview.');
        } else if (ext === 'odp') {
          setError('OpenDocument Presentation format is not currently supported.');
        } else {
          setError(`Unsupported presentation format: .${ext}`);
        }
      } catch (err) {
        console.error('Failed to load presentation:', err);
        setError('Failed to parse presentation file.');
      }

      setIsLoading(false);
    };

    loadPresentation();
  }, [ctx.file.data, ctx.file.extension]);

  useEffect(() => {
    ctx.onTotalPagesChange(slides.length);
  }, [slides.length, ctx.onTotalPagesChange]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newZoom = Math.max(0.25, Math.min(3, ctx.zoom + delta));
    ctx.onZoomChange(newZoom);
  }, [ctx]);

  const currentSlide = slides[ctx.page - 1];

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-preview-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading presentation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-preview-bg p-8">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-warning mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Presentation Preview Limited</h3>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      ref={containerRef}
      className="flex-1 flex bg-preview-bg"
    >
      {/* Thumbnail sidebar */}
      <ScrollArea className="w-24 md:w-28 flex-shrink-0 border-r border-border bg-secondary/30">
        <div className="p-2 space-y-2">
          {slides.map((slide, index) => (
            <motion.button
              key={index}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => ctx.onPageChange(index + 1)}
              className={cn(
                'w-full aspect-[16/9] rounded-lg border-2 transition-all overflow-hidden',
                'flex flex-col bg-gradient-to-br from-card to-secondary p-1.5',
                ctx.page === index + 1
                  ? 'border-primary ring-2 ring-primary/30'
                  : 'border-border hover:border-primary/50'
              )}
            >
              <div className="text-[7px] font-bold text-foreground truncate text-left">
                {slide.title}
              </div>
              <div className="flex-1 mt-0.5 space-y-0.5 overflow-hidden">
                {slide.content.slice(0, 3).map((item, i) => (
                  <div key={i} className="flex items-start gap-0.5">
                    <div className="w-0.5 h-0.5 rounded-full bg-primary mt-0.5 flex-shrink-0" />
                    <span className="text-[5px] text-muted-foreground truncate text-left">{item}</span>
                  </div>
                ))}
              </div>
              {/* Page number overlay */}
              <div className="absolute bottom-0.5 right-0.5 bg-background/80 px-1 py-0.5 rounded text-[7px] font-medium">
                {index + 1}
              </div>
            </motion.button>
          ))}
        </div>
      </ScrollArea>

      {/* Main content area */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-auto" onWheel={handleWheel}>
        <motion.div
          ref={slideRef}
          key={ctx.page}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="w-full max-w-4xl aspect-[16/9] bg-gradient-to-br from-card to-secondary rounded-xl shadow-heavy p-8 md:p-12 flex flex-col overflow-hidden"
          style={{
            zoom: ctx.zoom,
            transformOrigin: 'center center',
          }}
        >
          {currentSlide && (
            <>
              <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-6 flex-shrink-0">
                {currentSlide.title}
              </h2>
              <div className="flex-1 space-y-4 overflow-auto">
                {currentSlide.content.slice(0, 6).map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <p className="text-foreground/80 text-lg">{item}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </motion.div>

        {/* Navigation */}
        <div className="flex items-center justify-center gap-4 mt-6 flex-shrink-0">
          <Button
            variant="outline"
            size="icon"
            onClick={() => ctx.onPageChange(Math.max(1, ctx.page - 1))}
            disabled={ctx.page <= 1}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <span className="text-muted-foreground">
            {ctx.page} / {slides.length}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => ctx.onPageChange(Math.min(slides.length, ctx.page + 1))}
            disabled={ctx.page >= slides.length}
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};
