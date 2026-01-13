interface KeyboardShortcutOptions {
    onZoomIn?: () => void;
    onZoomOut?: () => void;
    onRotateLeft?: () => void;
    onRotateRight?: () => void;
    onNextPage?: () => void;
    onPrevPage?: () => void;
    onClose?: () => void;
    onFullscreen?: () => void;
    onDownload?: () => void;
    enabled?: boolean;
}
export declare function useKeyboardShortcuts({ onZoomIn, onZoomOut, onRotateLeft, onRotateRight, onNextPage, onPrevPage, onClose, onFullscreen, onDownload, enabled, }: KeyboardShortcutOptions): void;
export {};
