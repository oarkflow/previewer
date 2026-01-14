import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { PreviewContext } from '@/types/file-preview';
import { cn } from '@/lib/utils';

interface ImageRendererProps {
    ctx: PreviewContext;
}

export const ImageRenderer: React.FC<ImageRendererProps> = ({ ctx }) => {
    const [imageUrl, setImageUrl] = useState<string>('');
    const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
    const [isLoaded, setIsLoaded] = useState(false);
    const [initialFitApplied, setInitialFitApplied] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    // Reset initial fit when the file changes
    useEffect(() => {
        setInitialFitApplied(false);
    }, [ctx.file.name, ctx.file.data]);

    // Apply a fit-to-viewport zoom when image first loads
    useEffect(() => {
        if (isLoaded && containerRef.current && !initialFitApplied) {
            const containerWidth = containerRef.current.clientWidth;
            const containerHeight = containerRef.current.clientHeight;
            const availableWidth = containerWidth * 0.9;
            const availableHeight = containerHeight * 0.9;
            const fitScale = Math.min(1, (availableWidth / (naturalSize.width || 1)), (availableHeight / (naturalSize.height || 1)));
            if (!isNaN(fitScale) && fitScale > 0) {
                ctx.onZoomChange(fitScale);
            }
            setInitialFitApplied(true);
        }
    }, [isLoaded, naturalSize, ctx, initialFitApplied]);

    useEffect(() => {
        // Always create a blob URL from the file data to avoid CORS issues
        const blob = ctx.file.data instanceof Blob
            ? ctx.file.data
            : new Blob([ctx.file.data], { type: ctx.file.type || 'image/png' });
        const url = URL.createObjectURL(blob);
        setImageUrl(url);

        return () => {
            URL.revokeObjectURL(url);
        };
    }, [ctx.file.data, ctx.file.type]);
    // Reset position when zoom resets to 1
    useEffect(() => {
        if (ctx.zoom === 1) {
            setPosition({ x: 0, y: 0 });
        }
    }, [ctx.zoom]);

    const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const img = e.currentTarget;
        setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
        setIsLoaded(true);
    };

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (ctx.zoom > 1) {
            setIsDragging(true);
            setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
        }
    }, [ctx.zoom, position]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (isDragging && ctx.zoom > 1) {
            setPosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y,
            });
        }
    }, [isDragging, dragStart, ctx.zoom]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        const newZoom = Math.max(0.25, Math.min(3, ctx.zoom + delta));
        ctx.onZoomChange(newZoom);
    }, [ctx]);

    return (
        <div
            ref={containerRef}
            className={cn(
                "flex-1 flex items-center justify-center bg-preview-bg overflow-hidden",
                ctx.zoom > 1 && "cursor-grab",
                isDragging && "cursor-grabbing"
            )}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
        >
            <motion.div
                initial={{ opacity: 0 }}
                animate={{
                    opacity: isLoaded ? 1 : 0,
                }}
                transition={{ duration: 0.2 }}
                className="relative flex items-center justify-center"
                style={{
                    transform: `translate(${position.x}px, ${position.y}px) scale(${ctx.zoom}) rotate(${ctx.rotation}deg)`,
                    transformOrigin: 'center center',
                }}
            >
                {imageUrl && (
                    <img
                        src={imageUrl}
                        alt={ctx.file.name}
                        onLoad={handleImageLoad}
                        className={cn(
                            'max-w-[90vw] max-h-[calc(100vh-180px)] w-auto h-auto object-contain rounded-lg shadow-heavy',
                            'select-none pointer-events-none'
                        )}
                        draggable={false}
                    />
                )}
            </motion.div>

            {isLoaded && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 glass px-3 py-1.5 rounded-full text-xs text-muted-foreground">
                    {naturalSize.width} × {naturalSize.height} px • {Math.round(ctx.zoom * 100)}%
                </div>
            )}

            {!isLoaded && (
                <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                    <p className="text-muted-foreground">Loading image...</p>
                </div>
            )}
        </div>
    );
};
