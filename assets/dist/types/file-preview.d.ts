export interface FileMeta {
    name: string;
    size: number;
    type: string;
    extension: string;
    lastModified?: number;
    data: ArrayBuffer | Blob | File;
    url?: string;
}
export interface SearchMatch {
    pageIndex: number;
    matchIndex: number;
    text: string;
}
export interface PreviewContext {
    file: FileMeta;
    zoom: number;
    rotation: number;
    page: number;
    totalPages: number;
    searchQuery: string;
    searchMatches: SearchMatch[];
    currentMatchIndex: number;
    onZoomChange: (zoom: number) => void;
    onRotationChange: (rotation: number) => void;
    onPageChange: (page: number) => void;
    onTotalPagesChange: (total: number) => void;
    onSearchMatchesChange: (matches: SearchMatch[]) => void;
    onCurrentMatchChange: (index: number) => void;
}
export type FileCategory = 'pdf' | 'document' | 'spreadsheet' | 'presentation' | 'image' | 'audio' | 'video' | 'text' | 'code' | 'data' | 'binary';
export interface FileRenderer {
    category: FileCategory;
    extensions: string[];
    mimeTypes: string[];
    canHandle: (file: FileMeta) => boolean;
    render: (ctx: PreviewContext) => React.ReactNode;
}
export declare const FILE_CATEGORIES: Record<FileCategory, {
    label: string;
    icon: string;
    color: string;
}>;
export declare const EXTENSION_MAP: Record<string, FileCategory>;
export declare function getFileCategory(extension: string, mimeType?: string): FileCategory;
export declare function getFileExtension(filename: string): string;
export declare function formatFileSize(bytes: number): string;
