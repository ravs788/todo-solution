import React from 'react';
import { useToast } from '../context/ToastContext';
import ReminderToast from './ReminderToast';

const ToastContainer = () => {
  const { toasts } = useToast();

  return (
    <div style={{ position: 'fixed', top: 0, right: 0, zIndex: 1000 }}>
      {toasts.map(toast => (
        <ReminderToast key={toast.id} toast={toast} />
      ))}
    </div>
  );
};

export default ToastContainer;
