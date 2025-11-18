import React from 'react';
import { useToast } from '../context/ToastContext';

const ReminderToast = ({ toast }) => {
  const { removeToast } = useToast();

  if (toast.type !== 'reminder') return null;

  const handleSnooze = async () => {
    // Update reminderAt to +10 minutes
    const newReminderAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    try {
      const token = localStorage.getItem("jwtToken");
      const apiBase = process.env.REACT_APP_API_BASE_URL;
      await fetch(`${apiBase}/api/todos/${toast.todo.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          reminderAt: newReminderAt,
        }),
      });
      removeToast(toast.id);
    } catch (error) {
      // Error snoozing reminder
    }
  };

  const handleMarkDone = async () => {
    try {
      const token = localStorage.getItem("jwtToken");
      const apiBase = process.env.REACT_APP_API_BASE_URL;
      await fetch(`${apiBase}/api/todos/${toast.todo.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          completed: true,
        }),
      });
      removeToast(toast.id);
    } catch (error) {
      // Error marking todo done
    }
  };

  const handleDismiss = () => {
    removeToast(toast.id);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: '#fff',
        border: '1px solid #ccc',
        borderRadius: '8px',
        padding: '16px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        zIndex: 1000,
        minWidth: '300px',
        maxWidth: '400px'
      }}
      role="alert"
      aria-live="assertive"
    >
      <div style={{ marginBottom: '8px' }}>
        <strong>{toast.title}</strong>
      </div>
      <div style={{ marginBottom: '12px' }}>
        {toast.message}
      </div>
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <button
          onClick={handleSnooze}
          style={{
            padding: '6px 12px',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Snooze 10m
        </button>
        <button
          onClick={handleMarkDone}
          style={{
            padding: '6px 12px',
            background: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Mark Done
        </button>
        <button
          onClick={handleDismiss}
          style={{
            padding: '6px 12px',
            background: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
};

export default ReminderToast;
