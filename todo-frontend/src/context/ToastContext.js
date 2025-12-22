import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  
  // Make removeToast globally accessible so apps can close toasts by id
  if (typeof window !== "undefined") {
    window.__toastContext = {
      removeToast: (id) => setToasts(prev => prev.filter(t => t.id !== id))
    };
  }

  const showToast = useCallback((message, type = 'info', options = {}) => {
    const id = Date.now() + Math.random();
    const toast = {
      id,
      message,
      type,
      action: options.action,
      onAction: options.onAction,
      duration: typeof options.duration === 'number' ? options.duration : 5000,
      // Only allow pinning on *initial* show; after user action (onAction, etc.), all pinning is disabled
      persistent: options.persistent && !options.noPinAfterAction ? true : false
    };

    setToasts(prev => [...prev, toast]);

    // Only auto-remove if not persistent
    if (!toast.persistent) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, toast.duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast, clearToasts }}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export default ToastContext;
