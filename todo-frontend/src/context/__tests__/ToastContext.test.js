import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { ToastProvider, useToast } from '../ToastContext';
import { ThemeProvider } from '../ThemeContext';
import ToastContainer from '../../components/ToastContainer';

// Test component that uses the toast hook
const TestComponent = ({ onToastCountChange }) => {
  const { showToast, toasts, clearToasts } = useToast();

  // Notify parent of toast count changes
  React.useEffect(() => {
    onToastCountChange?.(toasts.length);
  }, [toasts.length, onToastCountChange]);

  return (
    <div>
      <button onClick={() => showToast('Test message', 'success')}>
        Show Success Toast
      </button>
      <button onClick={() => showToast('Error message', 'error', { action: 'Retry', onAction: () => {} })}>
        Show Error Toast with Action
      </button>
      <button onClick={() => clearToasts()}>
        Clear Toasts
      </button>
    </div>
  );
};

describe('ToastContext', () => {
  let toastCount = 0;
  const setToastCount = (count) => { toastCount = count; };

  beforeEach(() => {
    jest.useFakeTimers();
    toastCount = 0;
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should show and auto-remove toasts', async () => {
    render(
      <ThemeProvider>
        <ToastProvider>
          <TestComponent onToastCountChange={setToastCount} />
          <ToastContainer />
        </ToastProvider>
      </ThemeProvider>
    );

    const showButton = screen.getByText('Show Success Toast');
    fireEvent.click(showButton);

    await waitFor(() => expect(toastCount).toBe(1));
    expect(screen.getByText('Test message')).toBeInTheDocument();

    // Fast-forward timers to trigger auto-removal
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    await waitFor(() => expect(toastCount).toBe(0));
  });

  it('should handle toast with action', async () => {
    render(
      <ThemeProvider>
        <ToastProvider>
          <TestComponent onToastCountChange={setToastCount} />
          <ToastContainer />
        </ToastProvider>
      </ThemeProvider>
    );

    const actionButton = screen.getByText('Show Error Toast with Action');
    fireEvent.click(actionButton);

    await waitFor(() => expect(toastCount).toBe(1));
    expect(screen.getByText('Error message')).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('should manually remove toast', async () => {
    render(
      <ThemeProvider>
        <ToastProvider>
          <TestComponent onToastCountChange={setToastCount} />
          <ToastContainer />
        </ToastProvider>
      </ThemeProvider>
    );

    const showButton = screen.getByText('Show Success Toast');
    fireEvent.click(showButton);

    await waitFor(() => expect(toastCount).toBe(1));

    const closeButton = screen.getByLabelText('Close notification');
    fireEvent.click(closeButton);

    await waitFor(() => expect(toastCount).toBe(0));
  });

  it('should clear all toasts', async () => {
    render(
      <ThemeProvider>
        <ToastProvider>
          <TestComponent onToastCountChange={setToastCount} />
          <ToastContainer />
        </ToastProvider>
      </ThemeProvider>
    );

    const showButton = screen.getByText('Show Success Toast');
    fireEvent.click(showButton);
    fireEvent.click(showButton);

    await waitFor(() => expect(toastCount).toBe(2));

    const clearButton = screen.getByText('Clear Toasts');
    fireEvent.click(clearButton);

    await waitFor(() => expect(toastCount).toBe(0));
  });

  it('should handle action click', async () => {
    const mockOnAction = jest.fn();

    const TestActionComponent = () => {
      const { showToast } = useToast();

      return (
        <button
          onClick={() => showToast('Test', 'info', {
            action: 'Test Action',
            onAction: mockOnAction
          })}
        >
          Show Action Toast
        </button>
      );
    };

    render(
      <ThemeProvider>
        <ToastProvider>
          <TestActionComponent />
          <ToastContainer />
        </ToastProvider>
      </ThemeProvider>
    );

    const button = screen.getByText('Show Action Toast');
    fireEvent.click(button);

    await screen.findByText('Test Action');

    const actionButton = screen.getByText('Test Action');
    fireEvent.click(actionButton);

    expect(mockOnAction).toHaveBeenCalled();
  });
});
