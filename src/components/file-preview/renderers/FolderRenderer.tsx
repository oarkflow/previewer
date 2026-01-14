import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Folder,
    FolderOpen,
    File,
    FileText,
    Image,
    Video,
    Music,
    Code,
    Table,
    Archive,
    ChevronRight,
    ChevronDown,
    Home,
    Lock,
    Unlock,
    Search,
    Grid3x3,
    List,
    SortAsc,
    SortDesc,
    Calendar,
    HardDrive,
    FileType,
    AlertCircle,
    X,
} from 'lucide-react';
import { PreviewContext, FolderItem, formatFileSize, FileMeta, getFileExtension } from '@/types/file-preview';
import { MAX_SECURITY_CONFIG } from '@/types/security';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface FolderRendererProps {
    ctx: PreviewContext;
    onFileSelect?: (file: FolderItem) => void;
}

type SortField = 'name' | 'size' | 'date' | 'type';
type SortOrder = 'asc' | 'desc';
type ViewMode = 'list' | 'grid';

const getFileIcon = (item: FolderItem) => {
    if (item.type === 'folder') {
        return item.isSecure ? Lock : Folder;
    }

    const ext = item.extension?.toLowerCase() || '';

    // Image files
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) {
        return Image;
    }
    // Video files
    if (['mp4', 'avi', 'mov', 'mkv', 'webm'].includes(ext)) {
        return Video;
    }
    // Audio files
    if (['mp3', 'wav', 'ogg', 'flac', 'm4a'].includes(ext)) {
        return Music;
    }
    // Code files
    if (['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'cpp', 'c', 'go', 'rs', 'php', 'rb'].includes(ext)) {
        return Code;
    }
    // Spreadsheet files
    if (['xls', 'xlsx', 'csv'].includes(ext)) {
        return Table;
    }
    // Archive files
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
        return Archive;
    }

    return FileText;
};

const getFileColor = (item: FolderItem): string => {
    if (item.type === 'folder') {
        return item.isSecure ? 'text-red-500' : 'text-blue-500';
    }

    const ext = item.extension?.toLowerCase() || '';

    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) return 'text-purple-500';
    if (['mp4', 'avi', 'mov', 'mkv', 'webm'].includes(ext)) return 'text-pink-500';
    if (['mp3', 'wav', 'ogg', 'flac', 'm4a'].includes(ext)) return 'text-green-500';
    if (['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'cpp', 'c', 'go', 'rs', 'php', 'rb'].includes(ext)) return 'text-yellow-500';
    if (['xls', 'xlsx', 'csv'].includes(ext)) return 'text-emerald-500';
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return 'text-orange-500';

    return 'text-muted-foreground';
};

export const FolderRenderer: React.FC<FolderRendererProps> = ({ ctx, onFileSelect }) => {
    const folderData = ctx.file.folderData;

    const [currentPath, setCurrentPath] = useState<string[]>([]);
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState('');
    const [sortField, setSortField] = useState<SortField>('name');
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [selectedItem, setSelectedItem] = useState<FolderItem | null>(null);
    const [previewingFile, setPreviewingFile] = useState<FolderItem | null>(null);

    // Navigate through folder structure
    const getCurrentItems = useCallback((): FolderItem[] => {
        if (!folderData) return [];

        let items = folderData.items;

        // Navigate to current path
        for (const pathSegment of currentPath) {
            const folder = items.find(item => item.name === pathSegment && item.type === 'folder');
            if (folder?.children) {
                items = folder.children;
            } else {
                return [];
            }
        }

        return items;
    }, [folderData, currentPath]);

    // Filter and sort items
    const displayedItems = useMemo(() => {
        let items = getCurrentItems();

        // Filter by search
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            items = items.filter(item =>
                item.name.toLowerCase().includes(query) ||
                item.extension?.toLowerCase().includes(query)
            );
        }

        // Sort items
        items = [...items].sort((a, b) => {
            // Folders first
            if (a.type !== b.type) {
                return a.type === 'folder' ? -1 : 1;
            }

            let comparison = 0;
            switch (sortField) {
                case 'name':
                    comparison = a.name.localeCompare(b.name);
                    break;
                case 'size':
                    comparison = (a.size || 0) - (b.size || 0);
                    break;
                case 'date':
                    comparison = (a.lastModified || 0) - (b.lastModified || 0);
                    break;
                case 'type':
                    comparison = (a.extension || '').localeCompare(b.extension || '');
                    break;
            }

            return sortOrder === 'asc' ? comparison : -comparison;
        });

        return items;
    }, [getCurrentItems, searchQuery, sortField, sortOrder]);

    const toggleFolder = useCallback((path: string) => {
        setExpandedFolders(prev => {
            const next = new Set(prev);
            if (next.has(path)) {
                next.delete(path);
            } else {
                next.add(path);
            }
            return next;
        });
    }, []);

    const handleItemClick = useCallback((item: FolderItem) => {
        setSelectedItem(item);
        if (onFileSelect) {
            onFileSelect(item);
        }
    }, [onFileSelect]);

    const handleItemDoubleClick = useCallback((item: FolderItem) => {
        if (item.type === 'folder') {
            // Navigate into folder
            setCurrentPath(prev => [...prev, item.name]);
            setSelectedItem(null);
        } else {
            // Open file in new tab with URL params
            const urlParams = new URLSearchParams(window.location.search);
            const currentFolder = urlParams.get('folder') || folderData?.path || '';
            const fileUrl = `/?file=${encodeURIComponent(item.path)}&folder=${encodeURIComponent(currentFolder)}`;
            window.open(fileUrl, '_blank');
        }
    }, [folderData]);

    const handleBreadcrumbClick = useCallback((index: number) => {
        if (index === -1) {
            setCurrentPath([]);
        } else {
            setCurrentPath(prev => prev.slice(0, index + 1));
        }
        setSelectedItem(null);
    }, []);

    const toggleSort = useCallback((field: SortField) => {
        if (sortField === field) {
            setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('asc');
        }
    }, [sortField]);

    // Calculate stats
    const stats = useMemo(() => {
        const items = displayedItems;
        const files = items.filter(i => i.type === 'file');
        const folders = items.filter(i => i.type === 'folder');
        const totalSize = files.reduce((sum, f) => sum + (f.size || 0), 0);

        return {
            totalItems: items.length,
            files: files.length,
            folders: folders.length,
            totalSize,
        };
    }, [displayedItems]);

    if (!folderData) {
        return (
            <div className="flex-1 flex items-center justify-center bg-preview-bg">
                <div className="flex flex-col items-center gap-3">
                    <AlertCircle className="w-12 h-12 text-muted-foreground" />
                    <p className="text-muted-foreground">No folder data available</p>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col bg-preview-bg h-full overflow-hidden"
        >
            {/* Header with breadcrumbs and controls */}
            <div className="flex-shrink-0 border-b border-border bg-background/50 backdrop-blur-sm">
                <div className="p-4 space-y-3">
                    {/* Breadcrumbs */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleBreadcrumbClick(-1)}
                            className="h-8 px-2"
                        >
                            <Home className="w-4 h-4" />
                        </Button>
                        {currentPath.map((segment, index) => (
                            <React.Fragment key={index}>
                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleBreadcrumbClick(index)}
                                    className="h-8 px-3 font-medium"
                                >
                                    {segment}
                                </Button>
                            </React.Fragment>
                        ))}
                        {folderData.isSecure && (
                            <Badge variant="destructive" className="ml-2">
                                <Lock className="w-3 h-3 mr-1" />
                                Secured
                            </Badge>
                        )}
                    </div>

                    {/* Search and controls */}
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search files and folders..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 h-9"
                            />
                        </div>

                        <Separator orientation="vertical" className="h-6" />

                        {/* View mode toggle */}
                        <div className="flex gap-1 border rounded-md p-1">
                            <Button
                                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => setViewMode('list')}
                                className="h-7 w-7 p-0"
                            >
                                <List className="w-4 h-4" />
                            </Button>
                            <Button
                                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => setViewMode('grid')}
                                className="h-7 w-7 p-0"
                            >
                                <Grid3x3 className="w-4 h-4" />
                            </Button>
                        </div>

                        {/* Sort dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="h-9 gap-2">
                                    {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                                    Sort
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => toggleSort('name')}>
                                    <FileType className="w-4 h-4 mr-2" />
                                    Name {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => toggleSort('size')}>
                                    <HardDrive className="w-4 h-4 mr-2" />
                                    Size {sortField === 'size' && (sortOrder === 'asc' ? '↑' : '↓')}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => toggleSort('date')}>
                                    <Calendar className="w-4 h-4 mr-2" />
                                    Date {sortField === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => toggleSort('type')}>
                                    <FileText className="w-4 h-4 mr-2" />
                                    Type {sortField === 'type' && (sortOrder === 'asc' ? '↑' : '↓')}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Stats bar */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{stats.totalItems} items</span>
                        <Separator orientation="vertical" className="h-3" />
                        <span>{stats.folders} folders</span>
                        <Separator orientation="vertical" className="h-3" />
                        <span>{stats.files} files</span>
                        <Separator orientation="vertical" className="h-3" />
                        <span>{formatFileSize(stats.totalSize)}</span>
                    </div>
                </div>
            </div>

            {/* Content area */}
            <div className="flex-1 min-h-0 flex">
                {/* Main file list */}
                <ScrollArea className="flex-1">
                    <div className="p-4">
                        {displayedItems.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                <Folder className="w-16 h-16 mb-4 opacity-20" />
                                <p className="text-lg font-medium">No items found</p>
                                {searchQuery && (
                                    <p className="text-sm mt-1">Try a different search term</p>
                                )}
                            </div>
                        ) : viewMode === 'list' ? (
                            <div className="space-y-1">
                                {displayedItems.map((item) => {
                                    const Icon = getFileIcon(item);
                                    const color = getFileColor(item);

                                    return (
                                        <motion.div
                                            key={item.id}
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            whileHover={{ scale: 1.01 }}
                                            className={`
                        flex items-center gap-3 p-3 rounded-lg cursor-pointer
                        transition-colors hover:bg-accent/50
                        ${selectedItem?.id === item.id ? 'bg-accent' : ''}
                      `}
                                            onClick={() => handleItemClick(item)} onDoubleClick={() => handleItemDoubleClick(item)}                                        >
                                            <Icon className={`w-5 h-5 flex-shrink-0 ${color}`} />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium truncate">{item.name}</span>
                                                    {item.isSecure && (
                                                        <Lock className="w-3 h-3 text-red-500 flex-shrink-0" />
                                                    )}
                                                    {item.extension && item.type === 'file' && (
                                                        <Badge variant="outline" className="text-xs">
                                                            {item.extension}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                                    {item.type === 'file' && (
                                                        <span>{formatFileSize(item.size)}</span>
                                                    )}
                                                    {item.lastModified && (
                                                        <span>{new Date(item.lastModified).toLocaleDateString()}</span>
                                                    )}
                                                    {item.children && item.type === 'folder' && (
                                                        <span>{item.children.length} items</span>
                                                    )}
                                                </div>
                                            </div>
                                            {item.type === 'folder' && (
                                                <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                            )}
                                        </motion.div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                                {displayedItems.map((item) => {
                                    const Icon = getFileIcon(item);
                                    const color = getFileColor(item);

                                    return (
                                        <motion.div
                                            key={item.id}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            whileHover={{ scale: 1.05 }}
                                            className={`
                        flex flex-col items-center gap-2 p-4 rounded-lg cursor-pointer
                        transition-colors hover:bg-accent/50 border border-transparent
                        ${selectedItem?.id === item.id ? 'bg-accent border-accent-foreground/20' : ''}
                      `}
                                            onClick={() => handleItemClick(item)}
                                            onDoubleClick={() => handleItemDoubleClick(item)}
                                        >
                                            <div className="relative">
                                                <Icon className={`w-12 h-12 ${color}`} />
                                                {item.isSecure && (
                                                    <Lock className="w-4 h-4 text-red-500 absolute -top-1 -right-1" />
                                                )}
                                            </div>
                                            <div className="text-center w-full">
                                                <p className="text-sm font-medium truncate">{item.name}</p>
                                                {item.extension && item.type === 'file' && (
                                                    <p className="text-xs text-muted-foreground mt-1">{item.extension}</p>
                                                )}
                                                {item.type === 'file' && (
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {formatFileSize(item.size)}
                                                    </p>
                                                )}
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </ScrollArea>

                {/* Side panel for selected item details */}
                <AnimatePresence>
                    {selectedItem && (
                        <motion.div
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 320, opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            className="border-l border-border bg-background/30 backdrop-blur-sm overflow-hidden"
                        >
                            <ScrollArea className="h-full">
                                <div className="p-4 space-y-4">
                                    <div className="flex items-start justify-between">
                                        <h3 className="font-semibold">Details</h3>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setSelectedItem(null)}
                                            className="h-6 w-6 p-0"
                                        >
                                            ×
                                        </Button>
                                    </div>

                                    <Separator />

                                    <div className="space-y-3">
                                        <div className="flex flex-col items-center gap-3 py-4">
                                            {(() => {
                                                const Icon = getFileIcon(selectedItem);
                                                const color = getFileColor(selectedItem);
                                                return <Icon className={`w-16 h-16 ${color}`} />;
                                            })()}
                                            <p className="font-medium text-center break-all">{selectedItem.name}</p>
                                        </div>

                                        <Separator />

                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Type:</span>
                                                <span className="font-medium capitalize">{selectedItem.type}</span>
                                            </div>

                                            {selectedItem.extension && (
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Extension:</span>
                                                    <Badge variant="outline">{selectedItem.extension}</Badge>
                                                </div>
                                            )}

                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Size:</span>
                                                <span className="font-medium">{formatFileSize(selectedItem.size)}</span>
                                            </div>

                                            {selectedItem.lastModified && (
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Modified:</span>
                                                    <span className="font-medium">
                                                        {new Date(selectedItem.lastModified).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            )}

                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Path:</span>
                                                <span className="font-medium text-xs text-right break-all">
                                                    {selectedItem.path}
                                                </span>
                                            </div>

                                            {selectedItem.isSecure && (
                                                <>
                                                    <Separator />
                                                    <div className="flex items-center gap-2 text-red-500">
                                                        <Lock className="w-4 h-4" />
                                                        <span className="font-medium">Secured Item</span>
                                                    </div>
                                                </>
                                            )}

                                            {selectedItem.permissions && (
                                                <>
                                                    <Separator />
                                                    <div className="space-y-1">
                                                        <p className="text-muted-foreground">Permissions:</p>
                                                        <div className="flex flex-col gap-1 text-xs">
                                                            <div className="flex items-center gap-2">
                                                                {selectedItem.permissions.canRead ? (
                                                                    <Unlock className="w-3 h-3 text-green-500" />
                                                                ) : (
                                                                    <Lock className="w-3 h-3 text-red-500" />
                                                                )}
                                                                <span>Read</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                {selectedItem.permissions.canWrite ? (
                                                                    <Unlock className="w-3 h-3 text-green-500" />
                                                                ) : (
                                                                    <Lock className="w-3 h-3 text-red-500" />
                                                                )}
                                                                <span>Write</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                {selectedItem.permissions.canDelete ? (
                                                                    <Unlock className="w-3 h-3 text-green-500" />
                                                                ) : (
                                                                    <Lock className="w-3 h-3 text-red-500" />
                                                                )}
                                                                <span>Delete</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </ScrollArea>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* File Preview Modal */}
            <AnimatePresence>
                {previewingFile && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-background"
                    >
                        {/* Close button */}
                        <div className="absolute top-4 right-4 z-50">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setPreviewingFile(null)}
                                className="h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
                            >
                                <X className="w-5 h-5" />
                            </Button>
                        </div>

                        {/* Render file preview with security */}
                        <FilePreviewContent
                            file={previewingFile}
                            onClose={() => setPreviewingFile(null)}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

// Component to preview individual files with security
const FilePreviewContent: React.FC<{ file: FolderItem; onClose: () => void }> = ({ file, onClose }) => {
    // Note: In production, you would load the actual file data from the backend
    // For now, we show a placeholder indicating the file would be loaded securely

    return (
        <div className="h-full flex flex-col items-center justify-center p-8 gap-6">
            <div className="max-w-2xl w-full space-y-6">
                <div className="text-center space-y-4">
                    {(() => {
                        const Icon = getFileIcon(file);
                        const color = getFileColor(file);
                        return <Icon className={`w-24 h-24 mx-auto ${color}`} />;
                    })()}

                    <div>
                        <h2 className="text-2xl font-bold mb-2">{file.name}</h2>
                        <p className="text-muted-foreground">
                            {formatFileSize(file.size)} • {file.extension?.toUpperCase() || 'File'}
                        </p>
                    </div>
                </div>

                <div className="glass p-6 rounded-lg space-y-4">
                    <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-500">
                        <Lock className="w-5 h-5" />
                        <span className="font-semibold">Secured Preview</span>
                    </div>

                    <p className="text-sm text-muted-foreground">
                        This file requires secure preview with:
                    </p>

                    <ul className="text-sm space-y-2 text-muted-foreground">
                        <li className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                            Watermark overlay
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                            Screenshot resistance
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                            No download/copy protection
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                            Activity logging
                        </li>
                    </ul>

                    <div className="pt-4 border-t border-border">
                        <p className="text-xs text-muted-foreground">
                            <strong>Note:</strong> To preview this file with full security features,
                            use the command:
                        </p>
                        <code className="block mt-2 p-3 bg-muted rounded text-xs font-mono">
                            ./previewer --file "{file.path}"
                        </code>
                    </div>
                </div>

                <div className="flex justify-center gap-3">
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>
                </div>
            </div>
        </div>
    );
};
