import { renderHook, act } from '@testing-library/react';
import { useHistory, Command } from '../useHistory';

// Mock sessionStorage
const mockSessionStorage = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => { store[key] = value; }),
    removeItem: jest.fn((key) => { delete store[key]; }),
    clear: jest.fn(() => { store = {}; })
  };
})();

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
  writable: true
});

describe('useHistory Hook', () => {
  beforeEach(() => {
    mockSessionStorage.clear();
    jest.clearAllMocks();
  });

  it('should initialize with empty history', () => {
    const { result } = renderHook(() => useHistory());

    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it('should push commands to undo stack', () => {
    const { result } = renderHook(() => useHistory());

    const command = new Command('test-1', 'test', () => Promise.resolve(), () => Promise.resolve());

    act(() => {
      result.current.push(command);
    });

    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);
  });

  it('should undo commands correctly', async () => {
    const { result } = renderHook(() => useHistory());

    const mockUndo = jest.fn().mockResolvedValue(undefined);
    const command = new Command('test-1', 'test', () => Promise.resolve(), mockUndo);

    act(() => {
      result.current.push(command);
    });

    expect(result.current.canUndo).toBe(true);

    await act(async () => {
      await result.current.undo();
    });

    expect(mockUndo).toHaveBeenCalled();
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(true);
  });

  it('should redo commands correctly', async () => {
    const { result } = renderHook(() => useHistory());

    const mockDo = jest.fn().mockResolvedValue(undefined);
    const command = new Command('test-1', 'test', mockDo, () => Promise.resolve());

    act(() => {
      result.current.push(command);
    });

    await act(async () => {
      await result.current.undo();
    });

    expect(result.current.canRedo).toBe(true);

    await act(async () => {
      await result.current.redo();
    });

    expect(mockDo).toHaveBeenCalled();
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);
  });

  it('should clear redo stack when new command is pushed', async () => {
    const { result } = renderHook(() => useHistory());

    const command1 = new Command('test-1', 'test', () => Promise.resolve(), () => Promise.resolve());
    const command2 = new Command('test-2', 'test', () => Promise.resolve(), () => Promise.resolve());

    act(() => {
      result.current.push(command1);
    });

    await act(async () => {
      await result.current.undo();
    });

    expect(result.current.canRedo).toBe(true);

    act(() => {
      result.current.push(command2);
    });

    expect(result.current.canRedo).toBe(false);
  });

  it('should enforce maximum stack size', async () => {
    const maxSize = 3;
    const { result } = renderHook(() => useHistory(maxSize));

    // Push more commands than maxSize
    for (let i = 0; i < maxSize + 2; i++) {
      const command = new Command(`test-${i}`, 'test', () => Promise.resolve(), () => Promise.resolve());
      act(() => {
        result.current.push(command);
      });
    }

    // Should only be able to undo maxSize times
    for (let i = 0; i < maxSize; i++) {
      expect(result.current.canUndo).toBe(true);
      await act(async () => {
        await result.current.undo();
      });
    }

    expect(result.current.canUndo).toBe(false);
  });

  it('should persist history to sessionStorage', () => {
    const { result } = renderHook(() => useHistory());

    const command = new Command('test-1', 'test', () => Promise.resolve(), () => Promise.resolve());

    act(() => {
      result.current.push(command);
    });

    expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
      'undoRedoHistory',
      expect.any(String)
    );
  });

  it('should restore history from sessionStorage on mount', () => {
    const savedHistory = {
      undoStack: [{ id: 'test-1', kind: 'test', meta: { createdAt: Date.now() } }],
      redoStack: []
    };

    mockSessionStorage.getItem.mockReturnValue(JSON.stringify(savedHistory));

    const { result } = renderHook(() => useHistory());

    expect(result.current.canUndo).toBe(true);
  });

  it('should clear history', () => {
    const { result } = renderHook(() => useHistory());

    const command = new Command('test-1', 'test', () => Promise.resolve(), () => Promise.resolve());

    act(() => {
      result.current.push(command);
      result.current.clear();
    });

    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it('should handle undo errors gracefully', async () => {
    const { result } = renderHook(() => useHistory());

    const mockUndo = jest.fn().mockRejectedValue(new Error('Undo failed'));
    const command = new Command('test-1', 'test', () => Promise.resolve(), mockUndo);

    act(() => {
      result.current.push(command);
    });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await act(async () => {
      const success = await result.current.undo();
      expect(success).toBe(false);
    });

    expect(mockUndo).toHaveBeenCalled();
    expect(result.current.canUndo).toBe(true); // Command should be back in stack

    consoleSpy.mockRestore();
  });
});
