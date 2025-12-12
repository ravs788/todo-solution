import { renderHook } from '@testing-library/react';
import { useKeyboardShortcuts } from '../useKeyboardShortcuts';

// Mock the useHistory hook
jest.mock('../useHistory', () => ({
  useHistory: jest.fn()
}));

const mockUseHistory = require('../useHistory').useHistory;

describe('useKeyboardShortcuts', () => {
  let mockUndo, mockRedo;

  beforeEach(() => {
    mockUndo = jest.fn();
    mockRedo = jest.fn();

    mockUseHistory.mockReturnValue({
      canUndo: true,
      canRedo: true,
      undo: mockUndo,
      redo: mockRedo
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should call undo on Ctrl+Z', () => {
    renderHook(() => useKeyboardShortcuts());

    const event = new KeyboardEvent('keydown', {
      ctrlKey: true,
      key: 'z'
    });

    document.dispatchEvent(event);

    expect(mockUndo).toHaveBeenCalled();
  });

  it('should call redo on Ctrl+Shift+Z', () => {
    renderHook(() => useKeyboardShortcuts());

    const event = new KeyboardEvent('keydown', {
      ctrlKey: true,
      shiftKey: true,
      key: 'Z'
    });

    document.dispatchEvent(event);

    expect(mockRedo).toHaveBeenCalled();
  });

  it('should call redo on Ctrl+Y', () => {
    renderHook(() => useKeyboardShortcuts());

    const event = new KeyboardEvent('keydown', {
      ctrlKey: true,
      key: 'y'
    });

    document.dispatchEvent(event);

    expect(mockRedo).toHaveBeenCalled();
  });

  it('should not call undo when in input field', () => {
    renderHook(() => useKeyboardShortcuts());

    // Create a mock input element
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    const event = new KeyboardEvent('keydown', {
      ctrlKey: true,
      key: 'z'
    });
    // Set the target to the focused input
    Object.defineProperty(event, 'target', { value: input, writable: false });

    document.dispatchEvent(event);

    expect(mockUndo).not.toHaveBeenCalled();

    document.body.removeChild(input);
  });

  it('should not call undo when in textarea', () => {
    renderHook(() => useKeyboardShortcuts());

    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);
    textarea.focus();

    const event = new KeyboardEvent('keydown', {
      ctrlKey: true,
      key: 'z'
    });
    Object.defineProperty(event, 'target', { value: textarea, writable: false });

    document.dispatchEvent(event);

    expect(mockUndo).not.toHaveBeenCalled();

    document.body.removeChild(textarea);
  });

  it('should not call undo when in select element', () => {
    renderHook(() => useKeyboardShortcuts());

    const select = document.createElement('select');
    document.body.appendChild(select);
    select.focus();

    const event = new KeyboardEvent('keydown', {
      ctrlKey: true,
      key: 'z'
    });
    Object.defineProperty(event, 'target', { value: select, writable: false });

    document.dispatchEvent(event);

    expect(mockUndo).not.toHaveBeenCalled();

    document.body.removeChild(select);
  });

  it('should not call undo when in contenteditable element', () => {
    renderHook(() => useKeyboardShortcuts());

    const div = document.createElement('div');
    div.contentEditable = 'true';
    document.body.appendChild(div);
    div.focus();

    const event = new KeyboardEvent('keydown', {
      ctrlKey: true,
      key: 'z'
    });
    Object.defineProperty(event, 'target', { value: div, writable: false });

    document.dispatchEvent(event);

    expect(mockUndo).not.toHaveBeenCalled();

    document.body.removeChild(div);
  });

  it('should work with Cmd key on Mac (metaKey)', () => {
    renderHook(() => useKeyboardShortcuts());

    const event = new KeyboardEvent('keydown', {
      metaKey: true,
      key: 'z'
    });

    document.dispatchEvent(event);

    expect(mockUndo).toHaveBeenCalled();
  });

  it('should not call undo when canUndo is false', () => {
    mockUseHistory.mockReturnValue({
      canUndo: false,
      canRedo: true,
      undo: mockUndo,
      redo: mockRedo
    });

    renderHook(() => useKeyboardShortcuts());

    const event = new KeyboardEvent('keydown', {
      ctrlKey: true,
      key: 'z'
    });

    document.dispatchEvent(event);

    expect(mockUndo).not.toHaveBeenCalled();
  });

  it('should not call redo when canRedo is false', () => {
    mockUseHistory.mockReturnValue({
      canUndo: true,
      canRedo: false,
      undo: mockUndo,
      redo: mockRedo
    });

    renderHook(() => useKeyboardShortcuts());

    const event = new KeyboardEvent('keydown', {
      ctrlKey: true,
      shiftKey: true,
      key: 'Z'
    });

    document.dispatchEvent(event);

    expect(mockRedo).not.toHaveBeenCalled();
  });

  it('should ignore other key combinations', () => {
    renderHook(() => useKeyboardShortcuts());

    const event = new KeyboardEvent('keydown', {
      ctrlKey: true,
      key: 'a'
    });

    document.dispatchEvent(event);

    expect(mockUndo).not.toHaveBeenCalled();
    expect(mockRedo).not.toHaveBeenCalled();
  });
});
