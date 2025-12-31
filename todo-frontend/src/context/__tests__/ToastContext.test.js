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

function Providers({ children }) {
  return (
    <ThemeProvider>
      <ToastProvider>{children}</ToastProvider>
    </ThemeProvider>
  );
}

function Controls() {
  const { showToast } = useToast();
  const idRef = React.useRef(null);

  return (
    <div>
      <button
        data-testid="show-default-type"
        onClick={() => showToast('Default Type Only')}
      >
        show-default
      </button>

      <button
        data-testid="show-custom-duration"
        onClick={() => showToast('Custom Duration', undefined, { duration: 1234 })}
      >
        show-custom-duration
      </button>

      <button
        data-testid="show-persistent"
        onClick={() => showToast('Persistent Toast', 'info', { persistent: true, duration: 100 })}
      >
        show-persistent
      </button>

      <button
        data-testid="show-nopin-after-action"
        onClick={() => showToast('No Pin After Action', 'info', { persistent: true, noPinAfterAction: true, duration: 100 })}
      >
        show-nopin-after-action
      </button>

      <button
        data-testid="show-for-global-remove"
        onClick={() => {
          idRef.current = showToast('Global Remove');
        }}
      >
        show-for-global-remove
      </button>

      <button
        data-testid="call-global-remove"
        onClick={() => {
          if (window.__toastContext && idRef.current) {
            window.__toastContext.removeToast(idRef.current);
          }
        }}
      >
        call-global-remove
      </button>
    </div>
  );
}

describe('ToastContext', () => {
  let toastCount = 0;
  const setToastCount = (count) => { toastCount = count; };

  beforeEach(() => {
    jest.useFakeTimers();
    toastCount = 0;
  });

  afterEach(async () => {
    await act(async () => {
      jest.runOnlyPendingTimers();
    });
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

  // Extra targeted tests to improve branch coverage
  describe('extra branches', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });
    afterEach(() => {
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    });

    it('defaults type to "info" when not provided (border color branch)', async () => {
      render(
        <Providers>
          <Controls />
          <ToastContainer />
        </Providers>
      );

      fireEvent.click(screen.getByTestId('show-default-type'));

      // Toast should appear
      const alert = await screen.findByRole('alert');
      // The "info/default" color path uses #007bff in border
      expect(alert).toHaveStyle('border: 1px solid #007bff');
    });

    it('uses provided numeric duration and auto-removes at that duration (duration ternary branch)', async () => {
      render(
        <Providers>
          <Controls />
          <ToastContainer />
        </Providers>
      );

      fireEvent.click(screen.getByTestId('show-custom-duration'));

      await screen.findByText('Custom Duration');

      // Advance just beyond the specified duration
      act(() => {
        jest.advanceTimersByTime(1300);
      });

      await waitFor(() => {
        expect(screen.queryByText('Custom Duration')).not.toBeInTheDocument();
      });
    });

    it('persistent: true prevents auto-removal (else path of if(!toast.persistent))', async () => {
      render(
        <Providers>
          <Controls />
          <ToastContainer />
        </Providers>
      );

      fireEvent.click(screen.getByTestId('show-persistent'));

      const el = await screen.findByText('Persistent Toast');

      // Even after a long time, it should still be present
      act(() => {
        jest.advanceTimersByTime(10_000);
      });

      expect(el).toBeInTheDocument();
    });

    it('persistent blocked by noPinAfterAction (persistent becomes false so auto-removes)', async () => {
      render(
        <Providers>
          <Controls />
          <ToastContainer />
        </Providers>
      );

      fireEvent.click(screen.getByTestId('show-nopin-after-action'));

      await screen.findByText('No Pin After Action');

      act(() => {
        jest.advanceTimersByTime(150);
      });

      await waitFor(() => {
        expect(screen.queryByText('No Pin After Action')).not.toBeInTheDocument();
      });
    });

    it('window.__toastContext.removeToast(id) removes toast by id (global removal branch)', async () => {
      render(
        <Providers>
          <Controls />
          <ToastContainer />
        </Providers>
      );

      // Create a toast and record its id
      fireEvent.click(screen.getByTestId('show-for-global-remove'));
      await screen.findByText('Global Remove');

      // Use the globally exposed remover
      fireEvent.click(screen.getByTestId('call-global-remove'));

      await waitFor(() => {
        expect(screen.queryByText('Global Remove')).not.toBeInTheDocument();
      });
    });

    it('useToast throws when used outside ToastProvider (error branch)', () => {
      const Faulty = () => {
        useToast();
        return null;
      };

      expect(() => render(<Faulty />)).toThrow(
        'useToast must be used within a ToastProvider'
      );
    });

    it('defaults type to info and honors custom numeric duration', async () => {
      const Extra = () => {
        const { showToast } = useToast();
        return (
          <>
            <button data-testid="default-type" onClick={() => showToast('Default Type Only')}>a</button>
            <button data-testid="custom-duration" onClick={() => showToast('Custom Duration', undefined, { duration: 123 })}>b</button>
          </>
        );
      };
      render(
        <ThemeProvider>
          <ToastProvider>
            <Extra />
            <ToastContainer />
          </ToastProvider>
        </ThemeProvider>
      );

      fireEvent.click(screen.getByTestId('default-type'));
      const alert = await screen.findByRole('alert');
      expect(alert).toHaveStyle('border: 1px solid #007bff'); // info/default color

      fireEvent.click(screen.getByTestId('custom-duration'));
      await screen.findByText('Custom Duration');
      act(() => {
        jest.advanceTimersByTime(200); // >123ms
      });
      await waitFor(() => {
        expect(screen.queryByText('Custom Duration')).not.toBeInTheDocument();
      });
    });

    it('supports persistent: true (no auto-removal) and global window remover', async () => {
      const ControlsExtra = () => {
        const { showToast } = useToast();
        const idRef = React.useRef(null);
        return (
          <>
            <button
              data-testid="make-persistent"
              onClick={() => showToast('Persistent Toast', 'info', { persistent: true, duration: 100 })}
            >
              P
            </button>
            <button
              data-testid="spawn-global"
              onClick={() => {
                idRef.current = showToast('Global Remove');
              }}
            >
              G
            </button>
            <button
              data-testid="global-remove"
              onClick={() => window.__toastContext?.removeToast(idRef.current)}
            >
              X
            </button>
          </>
        );
      };

      render(
        <ThemeProvider>
          <ToastProvider>
            <ControlsExtra />
            <ToastContainer />
          </ToastProvider>
        </ThemeProvider>
      );

      // Persistent should stay even after long time
      fireEvent.click(screen.getByTestId('make-persistent'));
      const el = await screen.findByText('Persistent Toast');
      act(() => {
        jest.advanceTimersByTime(10_000);
      });
      expect(el).toBeInTheDocument();

      // Global window remover path
      fireEvent.click(screen.getByTestId('spawn-global'));
      await screen.findByText('Global Remove');
      fireEvent.click(screen.getByTestId('global-remove'));
      await waitFor(() => {
        expect(screen.queryByText('Global Remove')).not.toBeInTheDocument();
      });
    });

    it('noPinAfterAction disables persistence so it auto-removes', async () => {
      const Extra = () => {
        const { showToast } = useToast();
        return (
          <button
            data-testid="nopin"
            onClick={() =>
              showToast('No Pin After Action', 'info', { persistent: true, noPinAfterAction: true, duration: 100 })
            }
          >
            N
          </button>
        );
      };
      render(
        <ThemeProvider>
          <ToastProvider>
            <Extra />
            <ToastContainer />
          </ToastProvider>
        </ThemeProvider>
      );
      fireEvent.click(screen.getByTestId('nopin'));
      await screen.findByText('No Pin After Action');
      act(() => {
        jest.advanceTimersByTime(200);
      });
      await waitFor(() => {
        expect(screen.queryByText('No Pin After Action')).not.toBeInTheDocument();
      });
    });
  });
});
