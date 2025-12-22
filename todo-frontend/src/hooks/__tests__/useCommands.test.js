import { renderHook } from '@testing-library/react';

// Mock useUndoRedo to avoid invalid hook calls during test execution
jest.mock('../../context/UndoRedoContext', () => ({
  useUndoRedo: () => ({
    push: jest.fn() // Dummy push for global undo/redo, not used in unit test context
  })
}));
// Mock axios before importing useCommands
jest.mock('axios', () => ({
  create: jest.fn()
}));

// Get the mocked axios instance
const mockAxiosInstance = {
  post: jest.fn(),
  put: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
  interceptors: {
    request: { use: jest.fn() }
  }
};

// Set up the mock before importing
const axios = require('axios');
axios.create.mockReturnValue(mockAxiosInstance);

// Now import after mocking
const { createCommands } = require('../useCommands');

describe('useCommands', () => {
  let mockSetTodos;
  let mockShowToast;
  let commands;

  beforeEach(() => {
    mockSetTodos = jest.fn();
    mockShowToast = jest.fn();
    commands = createCommands(mockSetTodos, mockShowToast);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createTodoCommand', () => {
    it('should create a todo and update state', async () => {
      const todoData = { title: 'New Todo', description: 'Test' };
      const createdTodo = { id: 1, ...todoData };

      mockAxiosInstance.post.mockResolvedValue({ data: createdTodo });

      const command = commands.createTodoCommand(todoData);

      await command.do();

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/todos', todoData);
      expect(mockSetTodos).toHaveBeenCalledWith(expect.any(Function));
      expect(mockShowToast).toHaveBeenCalledWith('Todo created successfully', 'success');
    });

    it('should undo create by deleting the todo', async () => {
      const todoData = { title: 'New Todo' };
      const createdTodo = { id: 1, ...todoData };

      mockAxiosInstance.post.mockResolvedValue({ data: createdTodo });
      mockAxiosInstance.delete.mockResolvedValue({});

      const command = commands.createTodoCommand(todoData);

      await command.do();
      await command.undo();

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/todos/1');
      expect(mockSetTodos).toHaveBeenCalledWith(expect.any(Function));
    });
  });

  describe('updateTodoCommand', () => {
    it('should update a todo and revert on undo', async () => {
      const todoId = 1;
      const updatedData = { title: 'Updated Title' };
      const previousData = { title: 'Original Title' };
      const updatedTodo = { id: 1, ...updatedData };

      mockAxiosInstance.put.mockResolvedValue({ data: updatedTodo });

      const command = commands.updateTodoCommand(todoId, updatedData, previousData);

      await command.do();

      expect(mockAxiosInstance.put).toHaveBeenCalledWith('/todos/1', updatedData);
      expect(mockSetTodos).toHaveBeenCalledWith(expect.any(Function));

      // Test undo
      const revertedTodo = { id: 1, ...previousData };
      mockAxiosInstance.put.mockResolvedValue({ data: revertedTodo });

      await command.undo();

      expect(mockAxiosInstance.put).toHaveBeenCalledWith('/todos/1', previousData);
    });
  });

  describe('deleteTodoCommand', () => {
    it('should delete a todo and restore on undo', async () => {
      const todoId = 1;
      const todoData = { id: 1, title: 'Test Todo' };

      mockAxiosInstance.delete.mockResolvedValue({});
      mockAxiosInstance.post.mockResolvedValue({ data: todoData });

      const command = commands.deleteTodoCommand(todoId, todoData);

      await command.do();

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/todos/1');
      expect(mockSetTodos).toHaveBeenCalledWith(expect.any(Function));
      // Note: We do not expect a showToast here; the toast is triggered elsewhere (see useCommands.js)

      // Test undo
      await command.undo();

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/todos',
        expect.objectContaining({ title: 'Test Todo' })
      );
    });
  });

  describe('toggleCompleteCommand', () => {
    it('should toggle completion status', async () => {
      const todoId = 1;
      const currentCompleted = false;
      const toggledTodo = { id: 1, completed: true };

      mockAxiosInstance.patch.mockResolvedValue({ data: toggledTodo });

      const command = commands.toggleCompleteCommand(todoId, currentCompleted);

      await command.do();

      expect(mockAxiosInstance.patch).toHaveBeenCalledWith('/todos/1', { completed: true });
      expect(mockSetTodos).toHaveBeenCalledWith(expect.any(Function));
      expect(mockShowToast).toHaveBeenCalledWith('Todo marked as complete', 'success');

      // Test undo
      const revertedTodo = { id: 1, completed: false };
      mockAxiosInstance.patch.mockResolvedValue({ data: revertedTodo });

      await command.undo();

      expect(mockAxiosInstance.patch).toHaveBeenCalledWith('/todos/1', { completed: false });
    });
  });

  describe('error handling', () => {
    it('should handle create errors', async () => {
      const todoData = { title: 'New Todo' };

      mockAxiosInstance.post.mockRejectedValue(new Error('API Error'));

      const command = commands.createTodoCommand(todoData);

      await expect(command.do()).rejects.toThrow('API Error');
      expect(mockShowToast).toHaveBeenCalledWith('Failed to create todo', 'error');
    });

    it('should handle undo errors', async () => {
      const todoId = 1;
      const todoData = { id: 1, title: 'Test Todo' };

      mockAxiosInstance.delete.mockResolvedValue({});
      mockAxiosInstance.post.mockRejectedValue(new Error('Undo failed'));

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
