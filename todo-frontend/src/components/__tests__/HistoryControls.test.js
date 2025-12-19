import { render, screen, fireEvent } from '@testing-library/react';
import HistoryControls from '../HistoryControls';

// Mock the useHistory hook
jest.mock('../../hooks/useHistory', () => ({
  useHistory: jest.fn()
}));

// Mock the useUndoRedo hook to prevent "must be used within UndoRedoProvider" errors
jest.mock('../../context/UndoRedoContext', () => ({
  useUndoRedo: jest.fn()
}));

const mockUseHistory = require('../../hooks/useHistory').useHistory;
const mockUseUndoRedo = require('../../context/UndoRedoContext').useUndoRedo;

describe('HistoryControls', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render undo and redo buttons', () => {
    const mockVal = {
      canUndo: true,
      canRedo: true,
      undo: jest.fn(),
      redo: jest.fn()
    };
    mockUseHistory.mockReturnValue(mockVal);
    mockUseUndoRedo.mockReturnValue(mockVal);

    render(<HistoryControls />);

    expect(screen.getByText('↶ Undo')).toBeInTheDocument();
    expect(screen.getByText('↷ Redo')).toBeInTheDocument();
  });

  it('should enable undo button when canUndo is true', () => {
    const mockVal = {
      canUndo: true,
      canRedo: false,
      undo: jest.fn(),
      redo: jest.fn()
    };
    mockUseHistory.mockReturnValue(mockVal);
    mockUseUndoRedo.mockReturnValue(mockVal);

    render(<HistoryControls />);

    const undoButton = screen.getByText('↶ Undo');
    expect(undoButton).not.toBeDisabled();
    expect(undoButton).toHaveStyle({ opacity: 1 });
  });

  it('should disable undo button when canUndo is false', () => {
    const mockVal = {
      canUndo: false,
      canRedo: true,
      undo: jest.fn(),
      redo: jest.fn()
    };
    mockUseHistory.mockReturnValue(mockVal);
    mockUseUndoRedo.mockReturnValue(mockVal);

    render(<HistoryControls />);

    const undoButton = screen.getByText('↶ Undo');
    expect(undoButton).toBeDisabled();
    expect(undoButton).toHaveStyle({ opacity: 0.5 });
  });

  it('should enable redo button when canRedo is true', () => {
    const mockVal = {
      canUndo: false,
      canRedo: true,
      undo: jest.fn(),
      redo: jest.fn()
    };
    mockUseHistory.mockReturnValue(mockVal);
    mockUseUndoRedo.mockReturnValue(mockVal);

    render(<HistoryControls />);

    const redoButton = screen.getByText('↷ Redo');
    expect(redoButton).not.toBeDisabled();
    expect(redoButton).toHaveStyle({ opacity: 1 });
  });

  it('should disable redo button when canRedo is false', () => {
    const mockVal = {
      canUndo: true,
      canRedo: false,
      undo: jest.fn(),
      redo: jest.fn()
    };
    mockUseHistory.mockReturnValue(mockVal);
    mockUseUndoRedo.mockReturnValue(mockVal);

    render(<HistoryControls />);

    const redoButton = screen.getByText('↷ Redo');
    expect(redoButton).toBeDisabled();
    expect(redoButton).toHaveStyle({ opacity: 0.5 });
  });

  it('should call undo when undo button is clicked', () => {
    const mockUndo = jest.fn();
    const mockVal = {
      canUndo: true,
      canRedo: false,
      undo: mockUndo,
      redo: jest.fn()
    };
    mockUseHistory.mockReturnValue(mockVal);
    mockUseUndoRedo.mockReturnValue(mockVal);

    render(<HistoryControls />);

    const undoButton = screen.getByText('↶ Undo');
    fireEvent.click(undoButton);

    expect(mockUndo).toHaveBeenCalled();
  });

  it('should call redo when redo button is clicked', () => {
    const mockRedo = jest.fn();
    const mockVal = {
      canUndo: false,
      canRedo: true,
      undo: jest.fn(),
      redo: mockRedo
    };
    mockUseHistory.mockReturnValue(mockVal);
    mockUseUndoRedo.mockReturnValue(mockVal);

    render(<HistoryControls />);

    const redoButton = screen.getByText('↷ Redo');
    fireEvent.click(redoButton);

    expect(mockRedo).toHaveBeenCalled();
  });

  it('should have correct tooltips', () => {
    const mockVal = {
      canUndo: true,
      canRedo: true,
      undo: jest.fn(),
      redo: jest.fn()
    };
    mockUseHistory.mockReturnValue(mockVal);
    mockUseUndoRedo.mockReturnValue(mockVal);

    render(<HistoryControls />);

    const undoButton = screen.getByText('↶ Undo');
    const redoButton = screen.getByText('↷ Redo');

    expect(undoButton).toHaveAttribute('title', 'Undo (Ctrl+Z)');
    expect(redoButton).toHaveAttribute('title', 'Redo (Ctrl+Shift+Z)');
  });

  it('should have correct ARIA labels', () => {
    const mockVal = {
      canUndo: true,
      canRedo: true,
      undo: jest.fn(),
      redo: jest.fn()
    };
    mockUseHistory.mockReturnValue(mockVal);
    mockUseUndoRedo.mockReturnValue(mockVal);

    render(<HistoryControls />);

    const undoButton = screen.getByText('↶ Undo');
    const redoButton = screen.getByText('↷ Redo');

    expect(undoButton).toHaveAttribute('aria-label', 'Undo last action');
    expect(redoButton).toHaveAttribute('aria-label', 'Redo last undone action');
  });
});
