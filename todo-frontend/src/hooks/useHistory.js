import { useState, useCallback, useEffect } from 'react';

// Command types for undo/redo
export const COMMAND_TYPES = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  TOGGLE_COMPLETE: 'toggle-complete',
  TAGS_UPDATE: 'tags-update'
};

// Command interface
export class Command {
  constructor(id, kind, doFn, undoFn, meta = {}) {
    this.id = id;
    this.kind = kind;
    this.do = doFn;
    this.undo = undoFn;
    this.meta = {
      createdAt: Date.now(),
      ...meta
    };
  }
}

// History Manager class
export class HistoryManager {
  constructor(maxSize = 50) {
    this.undoStack = [];
    this.redoStack = [];
    this.maxSize = maxSize;
    this.listeners = [];
  }

  // Add listener for state changes
  addListener(callback) {
    this.listeners.push(callback);
  }

  removeListener(callback) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  notifyListeners() {
    this.listeners.forEach(callback => callback());
  }

  // Push a command to the undo stack
  push(command) {
    // Clear redo stack when new action is performed
    this.redoStack = [];

    // Add to undo stack
    this.undoStack.push(command);

    // Enforce max size
    if (this.undoStack.length > this.maxSize) {
      this.undoStack.shift();
    }

    this.notifyListeners();
  }

  // Undo the last command
  async undo() {
    if (!this.canUndo) return false;

    const command = this.undoStack.pop();

    try {
      await command.undo();
      this.redoStack.push(command);
      this.notifyListeners();
      return true;
    } catch (error) {
      // On error, put the command back
      this.undoStack.push(command);
      console.error('Undo failed:', error);
      return false;
    }
  }

  // Redo the last undone command
  async redo() {
    if (!this.canRedo) return false;

    const command = this.redoStack.pop();

    try {
      await command.do();
      this.undoStack.push(command);
      this.notifyListeners();
      return true;
    } catch (error) {
      // On error, put the command back
      this.redoStack.push(command);
      console.error('Redo failed:', error);
      return false;
    }
  }

  // Clear all history
  clear() {
    this.undoStack = [];
    this.redoStack = [];
    this.notifyListeners();
  }

  // Getters
  get canUndo() {
    return this.undoStack.length > 0;
  }

  get canRedo() {
    return this.redoStack.length > 0;
  }

  // Serialize for persistence
  serialize() {
    return {
      undoStack: this.undoStack.map(cmd => ({
        id: cmd.id,
        kind: cmd.kind,
        meta: cmd.meta
      })),
      redoStack: this.redoStack.map(cmd => ({
        id: cmd.id,
        kind: cmd.kind,
        meta: cmd.meta
      }))
    };
  }

  // Deserialize from persistence (limited - only reconstructs metadata)
  deserialize(data) {
    // Note: We can't reconstruct the actual do/undo functions from storage
    // This is just for metadata persistence
    if (data.undoStack) {
      this.undoStack = data.undoStack.map(item => ({
        ...item,
        do: () => Promise.resolve(),
        undo: () => Promise.resolve()
      }));
    }
    if (data.redoStack) {
      this.redoStack = data.redoStack.map(item => ({
        ...item,
        do: () => Promise.resolve(),
        undo: () => Promise.resolve()
      }));
    }
    this.notifyListeners();
  }
}

// React hook for using HistoryManager
export const useHistory = (maxSize = 50) => {
  const [historyManager] = useState(() => new HistoryManager(maxSize));
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const updateState = useCallback(() => {
    setCanUndo(historyManager.canUndo);
    setCanRedo(historyManager.canRedo);
  }, [historyManager]);

  useEffect(() => {
    historyManager.addListener(updateState);
    return () => historyManager.removeListener(updateState);
  }, [historyManager, updateState]);

  // Load from sessionStorage on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('undoRedoHistory');
      if (saved) {
        const data = JSON.parse(saved);
        historyManager.deserialize(data);
      }
    } catch (error) {
      console.warn('Failed to load history from sessionStorage:', error);
    }
  }, [historyManager]);

  // Save to sessionStorage whenever history changes
  useEffect(() => {
    const saveHistory = () => {
      try {
        const data = historyManager.serialize();
        sessionStorage.setItem('undoRedoHistory', JSON.stringify(data));
      } catch (error) {
        console.warn('Failed to save history to sessionStorage:', error);
      }
    };

    historyManager.addListener(saveHistory);
    return () => historyManager.removeListener(saveHistory);
  }, [historyManager]);

  const push = useCallback((command) => {
    historyManager.push(command);
  }, [historyManager]);

  const undo = useCallback(async () => {
    return await historyManager.undo();
  }, [historyManager]);

  const redo = useCallback(async () => {
    return await historyManager.redo();
  }, [historyManager]);

  const clear = useCallback(() => {
    historyManager.clear();
  }, [historyManager]);

  return {
    push,
    undo,
    redo,
    clear,
    canUndo,
    canRedo,
    historyManager
  };
};
