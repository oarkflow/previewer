import { useEffect, useCallback } from 'react';

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

export function useKeyboardShortcuts({
  onZoomIn,
  onZoomOut,
  onRotateLeft,
  onRotateRight,
  onNextPage,
  onPrevPage,
  onClose,
  onFullscreen,
  onDownload,
  enabled = true,
}: KeyboardShortcutOptions) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return;
    
    // Don't trigger shortcuts when typing in inputs
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        onClose?.();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        onPrevPage?.();
        break;
      case 'ArrowRight':
        e.preventDefault();
        onNextPage?.();
        break;
      case 'ArrowUp':
        e.preventDefault();
        onPrevPage?.();
        break;
      case 'ArrowDown':
        e.preventDefault();
        onNextPage?.();
        break;
      case '+':
      case '=':
        e.preventDefault();
        onZoomIn?.();
        break;
      case '-':
      case '_':
        e.preventDefault();
        onZoomOut?.();
        break;
      case '[':
        e.preventDefault();
        onRotateLeft?.();
        break;
      case ']':
        e.preventDefault();
        onRotateRight?.();
        break;
      case 'f':
      case 'F':
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          onFullscreen?.();
        }
        break;
      case 'd':
      case 'D':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          onDownload?.();
        }
        break;
      case '0':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          // Reset zoom could be handled externally
        }
        break;
    }
  }, [enabled, onZoomIn, onZoomOut, onRotateLeft, onRotateRight, onNextPage, onPrevPage, onClose, onFullscreen, onDownload]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
