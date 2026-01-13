import React from 'react';
import { PreviewContext } from '@/types/file-preview';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
interface PdfRendererProps {
    ctx: PreviewContext;
}
export declare const PdfRenderer: React.FC<PdfRendererProps>;
export {};
