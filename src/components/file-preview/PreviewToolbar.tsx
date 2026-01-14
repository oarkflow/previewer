import React from 'react';
import { motion } from 'framer-motion';
import {
    ZoomIn,
    ZoomOut,
    RotateCw,
    RotateCcw,
    ChevronLeft,
    ChevronRight,
    Download,
    X,
    Maximize2,
    Search,
    FileText,
    Table,
    Image,
    Music,
    Video,
    Code,
    File,
    Folder,
    Printer,
    ChevronUp,
    ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { FileCategory, FILE_CATEGORIES, formatFileSize } from '@/types/file-preview';

interface PreviewToolbarProps {
    fileName: string;
    fileSize: number;
    fileCategory: FileCategory;
    zoom: number;
    rotation: number;
    currentPage: number;
    totalPages: number;
    searchQuery: string;
    searchMatchCount?: number;
    currentSearchMatch?: number;
    showZoom?: boolean;
    showRotation?: boolean;
    showPagination?: boolean;
    showSearch?: boolean;
    showPrint?: boolean;
    showDownload?: boolean;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onResetZoom?: () => void;
    onRotateLeft: () => void;
    onRotateRight: () => void;
    onPrevPage: () => void;
    onNextPage: () => void;
    onSearchChange: (query: string) => void;
    onPrevSearchMatch?: () => void;
    onNextSearchMatch?: () => void;
    onDownload: () => void;
    onPrint?: () => void;
    onClose: () => void;
    onFullscreen?: () => void;
    securitySlot?: React.ReactNode;
}

const CategoryIcon: React.FC<{ category: FileCategory; className?: string }> = ({ category, className }) => {
    const icons: Record<FileCategory, React.ReactNode> = {
        pdf: <FileText className={className} />,
        document: <FileText className={className} />,
        spreadsheet: <Table className={className} />,
        presentation: <FileText className={className} />,
        image: <Image className={className} />,
        audio: <Music className={className} />,
        video: <Video className={className} />,
        text: <FileText className={className} />,
        code: <Code className={className} />,
        data: <Table className={className} />,
        binary: <File className={className} />,
        folder: <Folder className={className} />,
    };
    return <>{icons[category]}</>;
};

export const PreviewToolbar: React.FC<PreviewToolbarProps> = ({
    fileName,
    fileSize,
    fileCategory,
    zoom,
    rotation,
    currentPage,
    totalPages,
    searchQuery,
    searchMatchCount = 0,
    currentSearchMatch = 0,
    showZoom = true,
    showRotation = false,
    showPagination = false,
    showSearch = false,
    showPrint = false,
    showDownload = true,
    onZoomIn,
    onZoomOut,
    onResetZoom,
    onRotateLeft,
    onRotateRight,
    onPrevPage,
    onNextPage,
    onSearchChange,
    onPrevSearchMatch,
    onNextSearchMatch,
    onDownload,
    onPrint,
    onClose,
    onFullscreen,
    securitySlot,
}) => {
    const categoryInfo = FILE_CATEGORIES[fileCategory];

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-lg px-3 py-2 flex items-center justify-between gap-4 flex-wrap"
        >
            {/* File Info */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <CategoryIcon category={fileCategory} className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0">
                    <h3 className="font-medium text-sm text-foreground truncate max-w-[200px] md:max-w-[300px]">
                        {fileName}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                        {categoryInfo.label} • {formatFileSize(fileSize)}
                    </p>
                </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1 flex-wrap">
                {showSearch && (
                    <div className="relative mr-2 flex items-center gap-1">
                        <div className="relative">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => onSearchChange(e.target.value)}
                                className="pl-8 h-7 w-32 md:w-40 bg-secondary/50 border-border"
                            />
                        </div>
                        {searchQuery && searchMatchCount > 0 && (
                            <>
                                <span className="text-xs text-muted-foreground px-1">
                                    {currentSearchMatch}/{searchMatchCount}
                                </span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={onPrevSearchMatch}
                                    disabled={searchMatchCount === 0}
                                >
                                    <ChevronUp className="w-3 h-3" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={onNextSearchMatch}
                                    disabled={searchMatchCount === 0}
                                >
                                    <ChevronDown className="w-3 h-3" />
                                </Button>
                            </>
                        )}
                    </div>
                )}

                {showPagination && totalPages > 1 && (
                    <div className="flex items-center gap-1 mr-2 px-2 py-1 rounded-md bg-secondary/50">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={onPrevPage}
                                    disabled={currentPage <= 1}
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Previous page</TooltipContent>
                        </Tooltip>

                        <span className="text-sm text-foreground px-2 min-w-[60px] text-center">
                            {currentPage} / {totalPages}
                        </span>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={onNextPage}
                                    disabled={currentPage >= totalPages}
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Next page</TooltipContent>
                        </Tooltip>
                    </div>
                )}

                {showZoom && (
                    <div className="flex items-center gap-1 mr-2 px-2 py-1 rounded-md bg-secondary/50">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={onZoomOut}
                                    disabled={zoom <= 0.25}
                                >
                                    <ZoomOut className="w-4 h-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Zoom out</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={onResetZoom}
                                    className="text-sm text-foreground px-2 min-w-[50px] text-center hover:bg-muted rounded transition-colors"
                                >
                                    {Math.round(zoom * 100)}%
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>Reset zoom</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={onZoomIn}
                                    disabled={zoom >= 3}
                                >
                                    <ZoomIn className="w-4 h-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Zoom in</TooltipContent>
                        </Tooltip>
                    </div>
                )}

                {showRotation && (
                    <div className="flex items-center gap-1 mr-2">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={onRotateLeft}
                                >
                                    <RotateCcw className="w-4 h-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Rotate left</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={onRotateRight}
                                >
                                    <RotateCw className="w-4 h-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Rotate right</TooltipContent>
                        </Tooltip>
                    </div>
                )}

                <div className="flex items-center gap-1 border-l border-border pl-2 ml-1">
                    {showPrint && onPrint && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={onPrint}
                                >
                                    <Printer className="w-4 h-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Print (Ctrl+P)</TooltipContent>
                        </Tooltip>
                    )}

                    {onFullscreen && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={onFullscreen}
                                >
                                    <Maximize2 className="w-4 h-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Fullscreen</TooltipContent>
                        </Tooltip>
                    )}

                    {showDownload && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={onDownload}
                                >
                                    <Download className="w-4 h-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Download</TooltipContent>
                        </Tooltip>
                    )}

                    {securitySlot}

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 hover:bg-destructive/20 hover:text-destructive"
                                onClick={onClose}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Close</TooltipContent>
                    </Tooltip>
                </div>
            </div>
        </motion.div>
    );
};
