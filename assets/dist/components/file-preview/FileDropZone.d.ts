import React from 'react';
interface FileDropZoneProps {
    onFileSelect: (file: File) => void;
    onUrlSelect: (url: string) => void;
    className?: string;
}
export declare const FileDropZone: React.FC<FileDropZoneProps>;
export {};
