import React from 'react';
import { FileMeta } from '@/types/file-preview';
import { SecurityConfig } from '@/types/security';
interface FilePreviewerProps {
    file: FileMeta;
    onClose: () => void;
    onSelectHistoryFile?: (id: string) => void;
    initialSecurityConfig?: SecurityConfig;
}
export declare const FilePreviewer: React.FC<FilePreviewerProps>;
export {};
