import { renderHook } from '@testing-library/react';
import { createCommands } from "../useCommands";

/**
 * Mock axios instance created in useCommands via axios.create(...)
 * Expose method spies for control and assertions.
 */
jest.mock("axios", () => {
  const mockPost = jest.fn();
  const mockPut = jest.fn();
  const mockDelete = jest.fn();
  const mockPatch = jest.fn();
  const instance = {
    post: (...args) => mockPost(...args),
    put: (...args) => mockPut(...args),
    delete: (...args) => mockDelete(...args),
    patch: (...args) => mockPatch(...args),
    interceptors: { request: { use: jest.fn() } },
  };
  const create = jest.fn(() => instance);
  return {
    __esModule: true,
    default: { create },
    create,
    __mockPost: mockPost,
    __mockPut: mockPut,
    __mockDelete: mockDelete,
    __mockPatch: mockPatch,
  };
});

// Mock useUndoRedo to avoid invalid hook calls during test execution
jest.mock('../../context/UndoRedoContext', () => ({
  useUndoRedo: () => ({
    push: jest.fn() // Dummy push for global undo/redo, not used in unit test context
  })
}));

const { createCommands: createCommandsMain } = require('../useCommands');

describe('useCommands', () => {
  let mockSetTodos;
  let mockShowToast;
  let commands;
  let axiosModule;
  let state;
  let setTodos;
  let showToast;

  beforeEach(() => {
    mockSetTodos = jest.fn();
    mockShowToast = jest.fn();
    commands = createCommandsMain(mockSetTodos, mockShowToast);
    axiosModule = require("axios");
    axiosModule.__mockPost.mockReset();
    axiosModule.__mockPut.mockReset();
    axiosModule.__mockDelete.mockReset();
    axiosModule.__mockPatch.mockReset();

    // Simple mutable state + React-like setState helper
    state = [];
    setTodos = (updater) => {
      if (typeof updater === "function") {
        state = updater(state);
      } else {
        state = updater;
      }
    };
    showToast = jest.fn();

    process.env.REACT_APP_API_BASE_URL = "";
    localStorage.clear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createTodoCommand', () => {
    it('should create a todo and update state', async () => {
      const todoData = { title: 'New Todo', description: 'Test' };
      const createdTodo = { id: 1, ...todoData };

      axiosModule.__mockPost.mockResolvedValue({ data: createdTodo });

      const command = commands.createTodoCommand(todoData);

      await command.do();

      expect(axiosModule.__mockPost).toHaveBeenCalledWith('/todos', todoData);
      expect(mockSetTodos).toHaveBeenCalledWith(expect.any(Function));
      expect(mockShowToast).toHaveBeenCalledWith('Todo created successfully', 'success');
    });

    it('should undo create by deleting the todo', async () => {
      const todoData = { title: 'New Todo' };
      const createdTodo = { id: 1, ...todoData };

      axiosModule.__mockPost.mockResolvedValue({ data: createdTodo });
      axiosModule.__mockDelete.mockResolvedValue({});

      const command = commands.createTodoCommand(todoData);

      await command.do();
      await command.undo();

      expect(axiosModule.__mockDelete).toHaveBeenCalledWith('/todos/1');
      expect(mockSetTodos).toHaveBeenCalledWith(expect.any(Function));
    });

    it('createTodoCommand success updates state and shows success toast', async () => {
      const created = { id: 101, title: "New Task", completed: false, startDate: "2023-08-12T10:00:00Z" };
      axiosModule.__mockPost.mockResolvedValueOnce({ data: created });

      const cmd = createCommandsMain(setTodos, showToast).createTodoCommand({ title: "New Task" });

      const result = await cmd.do();

      expect(result).toEqual(created);
      expect(axiosModule.__mockPost).toHaveBeenCalledWith("/todos", { title: "New Task" });
      expect(state).toEqual([created]);
      expect(showToast).toHaveBeenCalledWith("Todo created successfully", "success");
    });

    it('createTodoCommand error path shows error toast and rethrows', async () => {
      axiosModule.__mockPost.mockRejectedValueOnce(new Error("API Error"));

      const cmd = createCommandsMain(setTodos, showToast).createTodoCommand({ title: "Bad Task" });

      await expect(cmd.do()).rejects.toThrow("API Error");
      expect(showToast).toHaveBeenCalledWith("Failed to create todo", "error");
    });
  });

  describe('updateTodoCommand', () => {
    it('should update a todo and revert on undo', async () => {
      const todoId = 1;
      const updatedData = { title: 'Updated Title' };
      const previousData = { title: 'Original Title' };
      const updatedTodo = { id: 1, ...updatedData };

      axiosModule.__mockPut.mockResolvedValue({ data: updatedTodo });

      const command = commands.updateTodoCommand(todoId, updatedData, previousData);

      await command.do();

      expect(axiosModule.__mockPut).toHaveBeenCalledWith('/todos/1', updatedData);
      expect(mockSetTodos).toHaveBeenCalledWith(expect.any(Function));

      // Test undo
      const revertedTodo = { id: 1, ...previousData };
      axiosModule.__mockPut.mockResolvedValue({ data: revertedTodo });

      await command.undo();

      expect(axiosModule.__mockPut).toHaveBeenCalledWith('/todos/1', previousData);
    });

    it('updateTodoCommand error path shows error toast and rethrows', async () => {
      axiosModule.__mockPut.mockRejectedValueOnce(new Error("Update failed"));

      const cmd = createCommandsMain(setTodos, showToast).updateTodoCommand(9, { title: "Updated" }, { title: "Prev" });

      await expect(cmd.do()).rejects.toThrow("Update failed");
      expect(showToast).toHaveBeenCalledWith("Failed to update todo", "error");
    });

    it('undoUpdate error path shows error toast and rethrows', async () => {
      axiosModule.__mockPut.mockRejectedValueOnce(new Error("Undo update failed"));

      const cmd = createCommandsMain(setTodos, showToast).updateTodoCommand(9, { title: "Updated" }, { title: "Prev" });

      await expect(cmd.undo()).rejects.toThrow("Undo update failed");
      expect(showToast).toHaveBeenCalledWith("Failed to undo todo update", "error", { persistent: true });
    });
  });

  describe('deleteTodoCommand', () => {
    it('should delete a todo and restore on undo', async () => {
      const todoId = 1;
      const todoData = { id: 1, title: 'Test Todo' };

      axiosModule.__mockDelete.mockResolvedValue({});
      axiosModule.__mockPost.mockResolvedValue({ data: todoData });

      const command = commands.deleteTodoCommand(todoId, todoData);

      await command.do();

      expect(axiosModule.__mockDelete).toHaveBeenCalledWith('/todos/1');
      expect(mockSetTodos).toHaveBeenCalledWith(expect.any(Function));
      // Note: We do not expect a showToast here; the toast is triggered elsewhere (see useCommands.js)

      // Test undo
      await command.undo();

      expect(axiosModule.__mockPost).toHaveBeenCalledWith(
        '/todos',
        expect.objectContaining({ title: 'Test Todo' })
      );
    });

    it('deleteTodoCommand error path shows error toast and rethrows', async () => {
      axiosModule.__mockDelete.mockRejectedValueOnce(new Error("Delete failed"));

      const cmd = createCommandsMain(setTodos, showToast).deleteTodoCommand(55, { title: "X", completed: false, startDate: "2023-08-12T10:00:00Z", tags: [] });

      await expect(cmd.do()).rejects.toThrow("Delete failed");
      expect(showToast).toHaveBeenCalledWith("Failed to delete todo", "error");
    });

    it('undoDelete restores todo and subsequent delete uses restored id via cmd.meta', async () => {
      // Prepare restored todo
      const restored = { id: 777, title: "Restored", completed: false, startDate: "2023-08-12T10:00:00Z" };
      axiosModule.__mockPost.mockResolvedValueOnce({ data: restored });

      const initialId = 33;
      const todoData = {
        title: "Original",
        completed: false,
        startDate: "2023-08-12T10:00:00Z",
        tags: ["t1", { name: "t2" }],
      };

      const cmd = createCommandsMain(setTodos, showToast).deleteTodoCommand(initialId, todoData);

      // Simulate undo (recreate)
      const result = await cmd.undo();
      expect(result).toEqual(restored);
      expect(state).toEqual([restored]);
      expect(showToast).toHaveBeenCalledWith("Todo deletion undone", "info", { persistent: true });

      // Now do the delete again; it should use restored.id (777), not initialId (33)
      axiosModule.__mockDelete.mockResolvedValueOnce({});
      await cmd.do();
      expect(axiosModule.__mockDelete).toHaveBeenCalledWith(`/todos/${restored.id}`);
    });
  });

  describe('toggleCompleteCommand', () => {
    it('should toggle completion status', async () => {
      const todoId = 1;
      const currentCompleted = false;
      const toggledTodo = { id: 1, completed: true };

      axiosModule.__mockPatch.mockResolvedValue({ data: toggledTodo });

      const command = commands.toggleCompleteCommand(todoId, currentCompleted);

      await command.do();

      expect(axiosModule.__mockPatch).toHaveBeenCalledWith('/todos/1', { completed: true });
      expect(mockSetTodos).toHaveBeenCalledWith(expect.any(Function));
      expect(mockShowToast).toHaveBeenCalledWith('Todo marked as complete', 'success');

      // Test undo
      const revertedTodo = { id: 1, completed: false };
      axiosModule.__mockPatch.mockResolvedValue({ data: revertedTodo });

      await command.undo();

      expect(axiosModule.__mockPatch).toHaveBeenCalledWith('/todos/1', { completed: false });
    });

    it('toggleCompleteCommand error path shows error toast', async () => {
      axiosModule.__mockPatch.mockRejectedValueOnce(new Error("Toggle failed"));

      const cmd = createCommandsMain(setTodos, showToast).toggleCompleteCommand(5, false); // will attempt to set completed -> true

      await expect(cmd.do()).rejects.toThrow("Toggle failed");
      expect(showToast).toHaveBeenCalledWith("Failed to update todo status", "error");
    });
  });

  describe('error handling', () => {
    it('should handle create errors', async () => {
      const todoData = { title: 'New Todo' };

      axiosModule.__mockPost.mockRejectedValue(new Error('API Error'));

      const command = commands.createTodoCommand(todoData);

      await expect(command.do()).rejects.toThrow('API Error');
      expect(mockShowToast).toHaveBeenCalledWith('Failed to create todo', 'error');
    });

    it('should handle undo errors', async () => {
      const todoId = 1;
      const todoData = { id: 1, title: 'Test Todo' };

      axiosModule.__mockDelete.mockResolvedValue({});
      axiosModule.__mockPost.mockRejectedValue(new Error('Undo failed'));

      const command = commands.deleteTodoCommand(todoId, todoData);

      await command.do();
      await expect(command.undo()).rejects.toThrow('Undo failed');
      expect(mockShowToast).toHaveBeenCalledWith(
        'Failed to undo todo deletion',
        'error',
        expect.anything() // Accept third options argument if present
      );
    });
  });
});
