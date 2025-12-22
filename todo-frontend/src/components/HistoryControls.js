import React, { useState, useEffect, useRef } from 'react';
import { useUndoRedo } from '../context/UndoRedoContext';

const HistoryControls = () => {
  const { canUndo, canRedo, undo, redo } = useUndoRedo();
  const [consecutiveUndos, setConsecutiveUndos] = useState(0);
  const [consecutiveRedos, setConsecutiveRedos] = useState(0);
  const prevCanUndo = useRef(canUndo);
  const prevCanRedo = useRef(canRedo);

  // Reset undo/redo counters if the stack changes (due to a new action)
  useEffect(() => {
    // If canUndo increases (stack grows), reset undo counter
    if (canUndo && !prevCanUndo.current) setConsecutiveUndos(0);
    // If canRedo increases (stack grows), reset redo counter
    if (canRedo && !prevCanRedo.current) setConsecutiveRedos(0);

    // If undo stack gets more items (new action performed), reset both counters as it's no longer consecutive
    if (canUndo !== prevCanUndo.current) setConsecutiveUndos(0);
    if (canRedo !== prevCanRedo.current) setConsecutiveRedos(0);
    prevCanUndo.current = canUndo;
    prevCanRedo.current = canRedo;
  }, [canUndo, canRedo]);

  // Listen for a 'refresh-todos' event (indicates new action outside undo/redo)
  useEffect(() => {
    const reset = () => {
      setConsecutiveUndos(0);
      setConsecutiveRedos(0);
    };
    window.addEventListener('refresh-todos', reset);
    return () => window.removeEventListener('refresh-todos', reset);
  }, []);

  const handleUndo = async () => {
    if (consecutiveUndos < 2 && canUndo) {
      await undo();
      setConsecutiveUndos((prev) => prev + 1);
      setConsecutiveRedos(0);
    }
  };

  const handleRedo = async () => {
    if (consecutiveRedos < 2 && canRedo) {
      await redo();
      setConsecutiveRedos((prev) => prev + 1);
      setConsecutiveUndos(0);
      // Automatically refresh UI after redo
      window.dispatchEvent(new Event('refresh-todos'));
    }
  };

  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      <button
        onClick={handleUndo}
        disabled={!canUndo || consecutiveUndos >= 2}
        style={{
          background: '#fff',
          color: canUndo && consecutiveUndos < 2 ? 'var(--btn-primary)' : '#888',
          border: '1.5px solid var(--btn-primary)',
          borderRadius: '4px',
          padding: '6px 14px',
          fontSize: '1rem',
          fontWeight: 600,
          cursor: canUndo && consecutiveUndos < 2 ? 'pointer' : 'not-allowed',
          opacity: canUndo && consecutiveUndos < 2 ? 1 : 0.5,
          transition: 'all 0.2s ease'
        }}
        title="Undo (Ctrl+Z)"
        aria-label="Undo last action"
      >
        ↶ Undo
      </button>
      <button
        onClick={handleRedo}
        disabled={!canRedo || consecutiveRedos >= 2}
        style={{
          background: '#fff',
          color: canRedo && consecutiveRedos < 2 ? 'var(--btn-primary)' : '#888',
          border: '1.5px solid var(--btn-primary)',
          borderRadius: '4px',
          padding: '6px 14px',
          fontSize: '1rem',
          fontWeight: 600,
          cursor: canRedo && consecutiveRedos < 2 ? 'pointer' : 'not-allowed',
          opacity: canRedo && consecutiveRedos < 2 ? 1 : 0.5,
          transition: 'all 0.2s ease'
        }}
        title="Redo (Ctrl+Shift+Z)"
        aria-label="Redo last undone action"
      >
        ↷ Redo
      </button>
    </div>
  );
};

export default HistoryControls;
