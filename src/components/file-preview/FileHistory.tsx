import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    History,
    X,
    FileText,
    Image,
    Music,
    Video,
    Table,
    Code,
    File,
    Trash2,
    ChevronLeft,
    Pin,
    GripVertical,
    Folder
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { FileHistoryItem } from '@/hooks/use-file-history';
import { formatFileSize, getFileCategory, FileCategory } from '@/types/file-preview';
import { cn } from '@/lib/utils';

interface FileHistoryProps {
    history: FileHistoryItem[];
    isOpen: boolean;
    onToggle: () => void;
    onSelectFile: (id: string) => void;
    onRemoveFile: (id: string) => void;
    onClearHistory: () => void;
    onTogglePin: (id: string) => void;
    onReorder: (activeId: string, overId: string) => void;
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

const formatTimeAgo = (timestamp: number): string => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
};

interface SortableHistoryItemProps {
    item: FileHistoryItem;
    onSelectFile: (id: string) => void;
    onRemoveFile: (id: string) => void;
    onTogglePin: (id: string) => void;
}

const SortableHistoryItem: React.FC<SortableHistoryItemProps> = ({
    item,
    onSelectFile,
    onRemoveFile,
    onTogglePin,
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: item.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const category = getFileCategory(item.extension, item.type);
    const hasData = !!item.data;

    return (
        <motion.div
            ref={setNodeRef}
            style={style}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: isDragging ? 0.5 : 1, x: 0 }}
            className={cn(
                'group relative rounded-lg p-3 transition-colors',
                hasData
                    ? 'hover:bg-sidebar-accent cursor-pointer'
                    : 'opacity-50 cursor-not-allowed',
                isDragging && 'z-50 shadow-lg bg-sidebar-accent'
            )}
            onClick={() => hasData && onSelectFile(item.id)}
        >
            <div className="flex items-start gap-2">
                {/* Drag handle */}
                <button
                    {...attributes}
                    {...listeners}
                    className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
                    onClick={(e) => e.stopPropagation()}
                >
                    <GripVertical className="w-4 h-4 text-sidebar-foreground/40" />
                </button>

                <div className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0",
                    item.isPinned ? "bg-primary/20" : "bg-sidebar-accent"
                )}>
                    <CategoryIcon category={category} className={cn(
                        "w-4 h-4",
                        item.isPinned ? "text-primary" : "text-sidebar-primary"
                    )} />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                        <p className="text-sm font-medium text-sidebar-foreground truncate">
                            {item.name}
                        </p>
                        {item.isPinned && (
                            <Pin className="w-3 h-3 text-primary flex-shrink-0" />
                        )}
                    </div>
                    <p className="text-xs text-sidebar-foreground/50">
                        {formatFileSize(item.size)} • {formatTimeAgo(item.timestamp)}
                    </p>
                </div>
            </div>

            {/* Actions */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                                e.stopPropagation();
                                onTogglePin(item.id);
                            }}
                            className={cn(
                                "h-7 w-7",
                                item.isPinned
                                    ? "text-primary"
                                    : "text-sidebar-foreground/50 hover:text-primary"
                            )}
                        >
                            <Pin className="w-3 h-3" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>{item.isPinned ? 'Unpin' : 'Pin to top'}</TooltipContent>
                </Tooltip>

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemoveFile(item.id);
                    }}
                    className="h-7 w-7 text-sidebar-foreground/50 hover:text-destructive"
                >
                    <X className="w-3 h-3" />
                </Button>
            </div>
        </motion.div>
    );
};

export const FileHistory: React.FC<FileHistoryProps> = ({
    history,
    isOpen,
    onToggle,
    onSelectFile,
    onRemoveFile,
    onClearHistory,
    onTogglePin,
    onReorder,
}) => {
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            onReorder(active.id as string, over.id as string);
        }
    };

    const pinnedItems = history.filter(item => item.isPinned);
    const unpinnedItems = history.filter(item => !item.isPinned);

    return (
        <>
            {/* Toggle button - always visible */}
            <motion.button
                onClick={onToggle}
                className={cn(
                    'fixed left-0 top-1/2 -translate-y-1/2 z-40',
                    'w-8 h-16 flex items-center justify-center',
                    'bg-secondary/90 backdrop-blur-sm border border-border rounded-r-lg',
                    'hover:bg-secondary transition-colors',
                    isOpen && 'left-64'
                )}
                animate={{ left: isOpen ? 256 : 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
                {isOpen ? (
                    <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                ) : (
                    <div className="flex flex-col items-center gap-1">
                        <History className="w-4 h-4 text-muted-foreground" />
                        {history.length > 0 && (
                            <span className="text-xs text-primary font-medium">{history.length}</span>
                        )}
                    </div>
                )}
            </motion.button>

            {/* Sidebar */}
            <AnimatePresence>
                {isOpen && (
                    <motion.aside
                        initial={{ x: -256, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -256, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="fixed left-0 top-0 bottom-0 w-64 z-30 bg-sidebar-background border-r border-sidebar-border flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
                            <div className="flex items-center gap-2">
                                <History className="w-5 h-5 text-sidebar-primary" />
                                <h2 className="font-semibold text-sidebar-foreground">History</h2>
                            </div>
                            {history.length > 0 && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={onClearHistory}
                                            className="h-8 w-8 text-sidebar-foreground/60 hover:text-destructive"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Clear history</TooltipContent>
                                </Tooltip>
                            )}
                        </div>

                        {/* History list */}
                        <ScrollArea className="flex-1">
                            {history.length === 0 ? (
                                <div className="p-6 text-center">
                                    <File className="w-10 h-10 text-sidebar-foreground/30 mx-auto mb-3" />
                                    <p className="text-sm text-sidebar-foreground/50">No files previewed yet</p>
                                </div>
                            ) : (
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={handleDragEnd}
                                >
                                    <div className="p-2 space-y-1">
                                        {pinnedItems.length > 0 && (
                                            <>
                                                <div className="px-2 py-1">
                                                    <span className="text-xs font-medium text-sidebar-foreground/50 uppercase tracking-wider">
                                                        Pinned
                                                    </span>
                                                </div>
                                                <SortableContext
                                                    items={pinnedItems.map(item => item.id)}
                                                    strategy={verticalListSortingStrategy}
                                                >
                                                    {pinnedItems.map((item) => (
                                                        <SortableHistoryItem
                                                            key={item.id}
                                                            item={item}
                                                            onSelectFile={onSelectFile}
                                                            onRemoveFile={onRemoveFile}
                                                            onTogglePin={onTogglePin}
                                                        />
                                                    ))}
                                                </SortableContext>
                                            </>
                                        )}

                                        {unpinnedItems.length > 0 && (
                                            <>
                                                {pinnedItems.length > 0 && (
                                                    <div className="px-2 py-1 mt-2">
                                                        <span className="text-xs font-medium text-sidebar-foreground/50 uppercase tracking-wider">
                                                            Recent
                                                        </span>
                                                    </div>
                                                )}
                                                <SortableContext
                                                    items={unpinnedItems.map(item => item.id)}
                                                    strategy={verticalListSortingStrategy}
                                                >
                                                    {unpinnedItems.map((item) => (
                                                        <SortableHistoryItem
                                                            key={item.id}
                                                            item={item}
                                                            onSelectFile={onSelectFile}
                                                            onRemoveFile={onRemoveFile}
                                                            onTogglePin={onTogglePin}
                                                        />
                                                    ))}
                                                </SortableContext>
                                            </>
                                        )}
                                    </div>
                                </DndContext>
                            )}
                        </ScrollArea>

                        {/* Footer */}
                        <div className="p-3 border-t border-sidebar-border">
                            <p className="text-xs text-sidebar-foreground/40 text-center">
                                Drag to reorder • {history.length} file{history.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>
        </>
    );
};
