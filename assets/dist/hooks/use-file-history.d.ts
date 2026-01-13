import { FileMeta } from '@/types/file-preview';
export interface FileHistoryItem {
    id: string;
    name: string;
    size: number;
    type: string;
    extension: string;
    timestamp: number;
    data: ArrayBuffer | Blob | File;
    isPinned: boolean;
    order: number;
}
export declare function useFileHistory(): {
    history: FileHistoryItem[];
    addToHistory: (file: FileMeta) => void;
    removeFromHistory: (id: string) => void;
    clearHistory: () => void;
    getFileFromHistory: (id: string) => FileMeta | null;
    togglePin: (id: string) => void;
    reorderHistory: (activeId: string, overId: string) => void;
};
