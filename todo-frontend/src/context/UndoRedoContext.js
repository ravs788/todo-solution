import React, { createContext, useContext } from "react";
import { useHistory } from "../hooks/useHistory";

// Provides a singleton HistoryManager (undo/redo) context
const UndoRedoContext = createContext();

export const UndoRedoProvider = ({ children }) => {
  // Use useRef to persist a single HistoryManager instance, but ONLY call hooks unconditionally
  const historyInstance = useHistory();

  return (
    <UndoRedoContext.Provider value={historyInstance}>
      {children}
    </UndoRedoContext.Provider>
  );
};

export const useUndoRedo = () => {
  const context = useContext(UndoRedoContext);
  if (!context) {
    throw new Error("useUndoRedo must be used within an UndoRedoProvider");
  }
  return context;
};
