import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ToastProvider, useToast } from '../ToastContext';
import { ThemeProvider } from '../ThemeContext';
import ToastContainer from '../../components/ToastContainer';

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

describe('ToastContext additional branch coverage', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(async () => {
    await act(async () => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  test('defaults type to "info" when not provided (border color branch)', async () => {
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

  test('uses provided numeric duration and auto-removes at that duration (duration ternary branch)', async () => {
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

  test('persistent: true prevents auto-removal (else path of if(!toast.persistent))', async () => {
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

  test('persistent blocked by noPinAfterAction (persistent becomes false so auto-removes)', async () => {
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

  test('window.__toastContext.removeToast(id) removes toast by id (global removal branch)', async () => {
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

  test('useToast throws when used outside ToastProvider (error branch)', () => {
    const Faulty = () => {
      useToast();
      return null;
    };

    expect(() => render(<Faulty />)).toThrow(
      'useToast must be used within a ToastProvider'
    );
  });
});
