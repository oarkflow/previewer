import React from 'react';
import { PreviewContext, FolderItem } from '@/types/file-preview';
interface FolderRendererProps {
    ctx: PreviewContext;
    onFileSelect?: (file: FolderItem) => void;
}
export declare const FolderRenderer: React.FC<FolderRendererProps>;
export {};
