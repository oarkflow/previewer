// File Viewer SDK
// Main entry point for the library

// React and ReactDOM (bundled for consumers)
export { default as React } from 'react';
export { default as ReactDOM } from 'react-dom/client';

// Core components
export { FileDropZone } from './components/file-preview/FileDropZone';
export { FilePreviewer } from './components/file-preview/FilePreviewer';
export { PreviewToolbar } from './components/file-preview/PreviewToolbar';
export { FileHistory } from './components/file-preview/FileHistory';

// Types and utilities
export type {
    FileMeta,
    PreviewContext,
    FileCategory,
} from './types/file-preview';

export {
    getFileCategory,
    getFileExtension,
    formatFileSize,
    EXTENSION_MAP,
    FILE_CATEGORIES,
} from './types/file-preview';

// Hooks
export { useFileHistory } from './hooks/use-file-history';

// UI Components (re-exported for convenience)
export { Button } from './components/ui/button';
export { Input } from './components/ui/input';
export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './components/ui/dialog';
export { ScrollArea } from './components/ui/scroll-area';
export { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
export { TooltipProvider } from './components/ui/tooltip';

// Styles
import './index.css';
