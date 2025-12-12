import React, { useContext } from 'react';
import ToastContext from '../context/ToastContext';
import ThemeContext from '../context/ThemeContext';

const ToastContainer = () => {
  const { toasts, removeToast } = useContext(ToastContext);
  const { isDarkMode } = useContext(ThemeContext);

  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 9999,
        maxWidth: '400px'
      }}
      role="region"
      aria-label="Toast notifications"
    >
      {toasts.map(toast => (
        <div
          key={toast.id}
          style={{
            background: isDarkMode ? '#333' : '#fff',
            color: isDarkMode ? '#fff' : '#333',
            border: `1px solid ${toast.type === 'error' ? '#dc3545' :
                               toast.type === 'success' ? '#28a745' :
                               toast.type === 'warning' ? '#ffc107' : '#007bff'}`,
            borderRadius: '4px',
            padding: '12px 16px',
            marginBottom: '8px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            animation: 'toastSlideIn 0.3s ease-out',
            position: 'relative'
          }}
          role="alert"
          aria-live="assertive"
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 500, marginBottom: toast.action ? '4px' : '0' }}>
              {toast.message}
            </div>
            {toast.action && (
              <button
                onClick={() => {
                  if (toast.onAction) {
                    toast.onAction();
                  }
                  removeToast(toast.id);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: toast.type === 'error' ? '#dc3545' :
                         toast.type === 'success' ? '#28a745' :
                         toast.type === 'warning' ? '#ffc107' : '#007bff',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: '0',
                  fontSize: 'inherit'
                }}
                aria-label={`${toast.action} - ${toast.message}`}
              >
                {toast.action}
              </button>
            )}
            {/* Pin toggle button for all toasts, always visible */}
            {/* REMOVE PIN BUTTON after user action; pin/unpin is confusing after Undo (never show PINNED after act) */}
            {/* Pin UI is now only shown for info popups and not for Undo/Redo after action */}
          </div>
          {/* Always show X close button for manual dismissal, regardless of persistent or not */}
          <button
            onClick={() => removeToast(toast.id)}
            style={{
              background: 'none',
              border: 'none',
              color: isDarkMode ? '#ccc' : '#666',
              cursor: 'pointer',
              fontSize: '20px',
              lineHeight: 1,
              padding: '0',
              marginLeft: '8px',
              width: '20px',
              height: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            aria-label="Close notification"
          >
            ×
          </button>
        </div>
      ))}

      <style>
        {`
          @keyframes toastSlideIn {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        `}
      </style>
    </div>
  );
};

export default ToastContainer;
