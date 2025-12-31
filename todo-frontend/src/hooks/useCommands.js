import { Command, COMMAND_TYPES } from './useHistory';
import { useUndoRedo } from "../context/UndoRedoContext";
import axios from 'axios';

// Create axios instance with auth interceptor
const api = axios.create({
  baseURL: `${process.env.REACT_APP_API_BASE_URL}/api`,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("jwtToken");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Generate unique command ID
const generateCommandId = () => `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const createCommands = (setTodos, showToast) => {

  // CREATE TODO COMMAND
  // Always push command to global undo/redo manager if available
  const { push } = (() => {
    try {
      return useUndoRedo();
    } catch {
      return { push: null };
    }
  })();

  const createTodoCommand = (todoData) => {
    let createdTodo = null;

    const doCreate = async () => {
      try {
        const response = await api.post('/todos', todoData);
        createdTodo = response.data;

        setTodos(prevTodos => [...prevTodos, createdTodo]);

        if (showToast) {
          showToast('Todo created successfully', 'success');
        }
        // Push command globally
        if (push) push(cmd);

        return createdTodo;
      } catch (error) {
        console.error('Failed to create todo:', error);
        if (showToast) {
          showToast('Failed to create todo', 'error');
        }
        throw error;
      }
    };

    const undoCreate = async () => {
      if (!createdTodo) return;

      try {
        await api.delete(`/todos/${createdTodo.id}`);
        setTodos(prevTodos => prevTodos.filter(todo => todo.id !== createdTodo.id));
        if (showToast) {
          showToast('Todo creation undone', 'info', { persistent: true });
        }
      } catch (error) {
        console.error('Failed to undo create:', error);
        if (showToast) {
          showToast('Failed to undo todo creation', 'error', { persistent: true });
        }
        throw error;
      }
    };

    const cmd = new Command(
      generateCommandId(),
      COMMAND_TYPES.CREATE,
      doCreate,
      undoCreate,
      { todoTitle: todoData.title }
    );
    return cmd;
  };

  // UPDATE TODO COMMAND
  const updateTodoCommand = (todoId, updatedData, previousData) => {
    let cmd; // Let so push reference works for stack
    const doUpdate = async () => {
      try {
        const response = await api.put(`/todos/${todoId}`, updatedData);
        const updatedTodo = response.data;

        setTodos(prevTodos =>
          prevTodos.map(todo =>
            todo.id === todoId ? updatedTodo : todo
          )
        );

        if (showToast) {
          showToast('Todo updated successfully', 'success');
        }
        if (push) push(cmd);

        return updatedTodo;
      } catch (error) {
        console.error('Failed to update todo:', error);
        if (showToast) {
          showToast('Failed to update todo', 'error');
        }
        throw error;
      }
    };

    const undoUpdate = async () => {
      try {
        const response = await api.put(`/todos/${todoId}`, previousData);
        const revertedTodo = response.data;

        setTodos(prevTodos =>
          prevTodos.map(todo =>
            todo.id === todoId ? revertedTodo : todo
          )
        );

        if (showToast) {
          showToast('Todo update undone', 'info', { persistent: true });
        }

        return revertedTodo;
      } catch (error) {
        console.error('Failed to undo update:', error);
        if (showToast) {
          showToast('Failed to undo todo update', 'error', { persistent: true });
        }
        throw error;
      }
    };

    cmd = new Command(
      generateCommandId(),
      COMMAND_TYPES.UPDATE,
      doUpdate,
      undoUpdate,
      {
        todoId,
        todoTitle: updatedData.title || previousData.title,
        changes: Object.keys(updatedData)
      }
    );
    return cmd;
  };

  // DELETE TODO COMMAND
  const deleteTodoCommand = (todoId, todoData) => {
    let cmd;
const doDelete = async () => {
      // Try to use new restored id from meta (if present after undo)
      const idToDelete = cmd && cmd.meta && cmd.meta.todoId ? cmd.meta.todoId : todoId;
      try {
        await api.delete(`/todos/${idToDelete}`);

        setTodos(prevTodos => prevTodos.filter(todo => todo.id !== todoId));
        // Do NOT show a toast here; it should be handled explicitly in handleDelete in TodoList.js, to avoid duplicates.
        if (push) push(cmd);

      } catch (error) {
        console.error('Failed to delete todo:', error);
        if (showToast) {
          showToast('Failed to delete todo', 'error');
        }
        throw error;
      }
    };

    const undoDelete = async () => {
      try {
        // Make a safe copy/hermetic, with only the backend-required fields
        const {
          title,
          completed,
          startDate,
          endDate,
          tags
        } = todoData || {};

        const sanitized = {
          title,
          completed,
          startDate,
          // Optional fields: only include if present
          endDate: endDate || undefined,
          activityType: todoData && todoData.activityType ? todoData.activityType : undefined,
          // Tags must be a string[] (backend expects list of names, not objects)
          tags: Array.isArray(tags)
            ? tags.map(tag => (typeof tag === 'string'
                ? tag
                : (tag.name || tag.id || tag.toString())))
            : []
        };

        const response = await api.post('/todos', sanitized);
const restoredTodo = response.data;

// Patch: update cmd.meta.todoId to new id for redo-undo-steps
if (cmd && cmd.meta) {
  cmd.meta.todoId = restoredTodo.id;
}

setTodos(prevTodos => [...prevTodos, restoredTodo]);

        if (showToast) {
          showToast('Todo deletion undone', 'info', { persistent: true });
        }

        return restoredTodo;
      } catch (error) {
        console.error('Failed to undo delete:', error);
        if (showToast) {
          showToast('Failed to undo todo deletion', 'error', { persistent: true });
        }
        throw error;
      }
    };

    cmd = new Command(
      generateCommandId(),
      COMMAND_TYPES.DELETE,
      doDelete,
      undoDelete,
      { todoId, todoTitle: todoData.title }
    );
    return cmd;
  };

  // TOGGLE COMPLETE COMMAND
  const toggleCompleteCommand = (todoId, currentCompleted) => {
    let cmd;
    const newCompleted = !currentCompleted;

    const doToggle = async () => {
      try {
        const response = await api.patch(`/todos/${todoId}`, {
          completed: newCompleted
        });
        const updatedTodo = response.data;

        setTodos(prevTodos =>
          prevTodos.map(todo =>
            todo.id === todoId ? updatedTodo : todo
          )
        );

        if (showToast) {
          showToast(
            newCompleted ? 'Todo marked as complete' : 'Todo marked as incomplete',
            'success'
          );
        }
        if (push) push(cmd);

        return updatedTodo;
      } catch (error) {
        console.error('Failed to toggle todo:', error);
        if (showToast) {
          showToast('Failed to update todo status', 'error');
        }
        throw error;
      }
    };

    const undoToggle = async () => {
      try {
        const response = await api.patch(`/todos/${todoId}`, {
          completed: currentCompleted
        });
        const revertedTodo = response.data;

        setTodos(prevTodos =>
          prevTodos.map(todo =>
            todo.id === todoId ? revertedTodo : todo
          )
        );

        if (showToast) {
          showToast('Todo status change undone', 'info', { persistent: true });
        }

        return revertedTodo;
      } catch (error) {
        console.error('Failed to undo toggle:', error);
        if (showToast) {
          showToast('Failed to undo status change', 'error', { persistent: true });
        }
        throw error;
      }
    };

    cmd = new Command(
      generateCommandId(),
      COMMAND_TYPES.TOGGLE_COMPLETE,
      doToggle,
      undoToggle,
      { todoId, completed: newCompleted }
    );
    return cmd;
  };

  return {
    createTodoCommand,
    updateTodoCommand,
    deleteTodoCommand,
    toggleCompleteCommand
  };
};
