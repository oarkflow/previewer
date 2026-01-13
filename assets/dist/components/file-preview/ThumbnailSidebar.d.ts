import React from 'react';
interface ThumbnailSidebarProps {
    pdfUrl?: string;
    slides?: {
        title: string;
        content: string[];
    }[];
    totalPages: number;
    currentPage: number;
    onPageChange: (page: number) => void;
    type: 'pdf' | 'presentation';
}
export declare const ThumbnailSidebar: React.FC<ThumbnailSidebarProps>;
export {};
