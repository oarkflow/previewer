import React from 'react';
import { FileHistoryItem } from '@/hooks/use-file-history';
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
export declare const FileHistory: React.FC<FileHistoryProps>;
export {};
