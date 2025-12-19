import { useEffect, useCallback } from 'react';
import { useToast } from '../context/ToastContext';
import AuthContext from '../context/AuthContext';
import { useContext } from 'react';

const useReminderScheduler = () => {
  const { showReminderToast } = useToast();
  const { user } = useContext(AuthContext);

  const checkReminders = useCallback(async () => {
    if (!user || user.status !== 'ACTIVE') return;

    try {
      const token = localStorage.getItem("jwtToken");
      const apiBase = process.env.REACT_APP_API_BASE_URL;
      const response = await fetch(`${apiBase}/api/todos`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });
      const todos = await response.json();

      const now = new Date();
      const dueTodos = todos.filter(todo => {
        if (!todo.reminderAt || todo.reminderStatus !== 'PENDING') return false;
        const reminderTime = new Date(todo.reminderAt);
        return reminderTime <= now;
      });

      dueTodos.forEach(todo => {
        showReminderToast(todo);
        // Mark as sent in local state (backend will handle persistence)
        todo.reminderStatus = 'SENT';
      });
    } catch (error) {
      // Error checking reminders
    }
  }, [user, showReminderToast]);

  useEffect(() => {
    if (!user || user.status !== 'ACTIVE') return;

    // Check immediately on mount
    checkReminders();

    // Check every 30 seconds
    const interval = setInterval(checkReminders, 30000);

    return () => clearInterval(interval);
  }, [user, checkReminders]);
};

export default useReminderScheduler;
