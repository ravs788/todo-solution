import { useEffect, useCallback } from 'react';
import { useHistory } from './useHistory';

export const useKeyboardShortcuts = () => {
  const { canUndo, canRedo, undo, redo } = useHistory();

  const handleKeyDown = useCallback((event) => {
    // Only handle shortcuts when not typing in input fields
    const target = event.target;
    const isInput = target.tagName === 'INPUT' ||
                   target.tagName === 'TEXTAREA' ||
                   target.tagName === 'SELECT' ||
                   target.contentEditable === 'true';

    if (isInput) return;

    // Undo: Ctrl+Z (Cmd+Z on Mac)
    if ((event.ctrlKey || event.metaKey) && !event.shiftKey && event.key === 'z') {
      event.preventDefault();
      if (canUndo) {
        undo();
      }
    }

    // Redo: Ctrl+Shift+Z (Cmd+Shift+Z on Mac) or Ctrl+Y
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'Z') {
      event.preventDefault();
      if (canRedo) {
        redo();
      }
    }

    // Alternative Redo: Ctrl+Y
    if ((event.ctrlKey || event.metaKey) && event.key === 'y') {
      event.preventDefault();
      if (canRedo) {
        redo();
      }
    }
  }, [canUndo, canRedo, undo, redo]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
};
