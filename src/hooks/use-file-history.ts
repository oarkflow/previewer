import { useState, useCallback, useEffect } from 'react';
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

const MAX_HISTORY_ITEMS = 10;
const STORAGE_KEY = 'file-preview-history';

// Generate a simple hash for the file
function generateFileId(file: FileMeta): string {
  return `${file.name}-${file.size}-${file.lastModified || Date.now()}`;
}

export function useFileHistory() {
  const [history, setHistory] = useState<FileHistoryItem[]>([]);

  // Load history metadata from sessionStorage on mount
  useEffect(() => {
      // Clear history on page refresh
      sessionStorage.removeItem(STORAGE_KEY);
      setHistory([]);
  }, []);

  // Persist history metadata to sessionStorage
  const persistHistory = useCallback((items: FileHistoryItem[]) => {
    try {
      const toStore = items.map(({ data, ...rest }) => rest);
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
    } catch (e) {
      console.warn('Failed to persist file history:', e);
    }
  }, []);

  const addToHistory = useCallback((file: FileMeta) => {
    const id = generateFileId(file);

    setHistory(prev => {
      // Remove duplicate if exists
      const filtered = prev.filter(item => item.id !== id);

      // Add new item at the start
      const newItem: FileHistoryItem = {
        id,
        name: file.name,
        size: file.size,
        type: file.type,
        extension: file.extension,
        timestamp: Date.now(),
        data: file.data,
        isPinned: false,
        order: 0,
      };

      const updated = [newItem, ...filtered].slice(0, MAX_HISTORY_ITEMS).map((item, idx) => ({
        ...item,
        order: idx,
      }));
      persistHistory(updated);
      return updated;
    });
  }, [persistHistory]);

  const removeFromHistory = useCallback((id: string) => {
    setHistory(prev => {
      const updated = prev.filter(item => item.id !== id).map((item, idx) => ({
        ...item,
        order: idx,
      }));
      persistHistory(updated);
      return updated;
    });
  }, [persistHistory]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    sessionStorage.removeItem(STORAGE_KEY);
  }, []);

  const getFileFromHistory = useCallback((id: string): FileMeta | null => {
    const item = history.find(h => h.id === id);
    if (!item || !item.data) return null;

    return {
      name: item.name,
      size: item.size,
      type: item.type,
      extension: item.extension,
      data: item.data,
    };
  }, [history]);

  const togglePin = useCallback((id: string) => {
    setHistory(prev => {
      const updated = prev.map(item => 
        item.id === id ? { ...item, isPinned: !item.isPinned } : item
      );
      // Sort: pinned first, then by timestamp
      updated.sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return b.timestamp - a.timestamp;
      });
      const reordered = updated.map((item, idx) => ({ ...item, order: idx }));
      persistHistory(reordered);
      return reordered;
    });
  }, [persistHistory]);

  const reorderHistory = useCallback((activeId: string, overId: string) => {
    setHistory(prev => {
      const oldIndex = prev.findIndex(item => item.id === activeId);
      const newIndex = prev.findIndex(item => item.id === overId);
      
      if (oldIndex === -1 || newIndex === -1) return prev;
      
      const updated = [...prev];
      const [removed] = updated.splice(oldIndex, 1);
      updated.splice(newIndex, 0, removed);
      
      const reordered = updated.map((item, idx) => ({ ...item, order: idx }));
      persistHistory(reordered);
      return reordered;
    });
  }, [persistHistory]);

  return {
    history,
    addToHistory,
    removeFromHistory,
    clearHistory,
    getFileFromHistory,
    togglePin,
    reorderHistory,
  };
}
