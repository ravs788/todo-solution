import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Command } from "../../hooks/useHistory";
import { UndoRedoProvider, useUndoRedo } from "../UndoRedoContext";
import * as useHistoryModule from "../../hooks/useHistory";

let canUndo = false;
let canRedo = false;

const mockHistory = {
  push: jest.fn(() => {
    canUndo = true;
    canRedo = false;
  }),
  undo: jest.fn(async () => {
    canUndo = false;
    canRedo = true;
    return true;
  }),
  redo: jest.fn(async () => {
    canUndo = true;
    canRedo = false;
    return true;
  }),
  clear: jest.fn(() => {
    canUndo = false;
    canRedo = false;
  }),
  get canUndo() {
    return canUndo;
  },
  get canRedo() {
    return canRedo;
  },
  historyManager: {}
};

let useHistorySpy;

beforeEach(() => {
  jest.clearAllMocks();
  canUndo = false;
  canRedo = false;
  useHistorySpy = jest.spyOn(useHistoryModule, 'useHistory').mockImplementation(() => mockHistory);
});

describe("UndoRedoContext", () => {
  describe("additional branch coverage", () => {
    test("useUndoRedo throws outside provider (error branch)", () => {
      const Faulty = () => {
        useUndoRedo();
        return null;
      };
      expect(() => render(<Faulty />)).toThrow(
        "useUndoRedo must be used within an UndoRedoProvider"
      );
    });

    test.skip("provider supplies history instance and toggles canUndo/canRedo via push/undo/redo", async () => {
      const Consumer = () => {
        const { push, undo, redo, clear, canUndo, canRedo } = useUndoRedo();
        const cmdRef = React.useRef(null);
        const [, setUpdateKey] = React.useState(0);

        const createCommand = () => {
          const doFn = jest.fn(() => Promise.resolve());
          const undoFn = jest.fn(() => Promise.resolve());
          const cmd = new Command("id-1", "test", doFn, undoFn, { note: "x" });
          cmdRef.current = { cmd, doFn, undoFn };
          return cmd;
        };

        return (
          <div>
            <div data-testid="canUndo">{String(canUndo)}</div>
            <div data-testid="canRedo">{String(canRedo)}</div>

            <button
              data-testid="push"
              onClick={() => {
                const c = createCommand();
                push(c);
                setUpdateKey(prev => prev + 1);
              }}
            >
              push
            </button>
            <button data-testid="undo" onClick={() => {
              undo();
              setUpdateKey(prev => prev + 1);
            }}>undo</button>
            <button data-testid="redo" onClick={() => {
              redo();
              setUpdateKey(prev => prev + 1);
            }}>redo</button>
            <button data-testid="clear" onClick={() => {
              clear();
              setUpdateKey(prev => prev + 1);
            }}>clear</button>

            {/* expose mocks for assertions via attributes */}
            <div
              data-testid="mocks"
              data-did-call-do={cmdRef.current?.doFn.mock.calls.length || 0}
              data-did-call-undo={cmdRef.current?.undoFn.mock.calls.length || 0}
            />
          </div>
        );
      };

      render(
        <UndoRedoProvider>
          <Consumer />
        </UndoRedoProvider>
      );

      // Initially false
      expect(screen.getByTestId("canUndo").textContent).toBe("false");
      expect(screen.getByTestId("canRedo").textContent).toBe("false");

      // After push, canUndo becomes true
      await userEvent.click(screen.getByTestId("push"));
      await waitFor(() =>
        expect(screen.getByTestId("canUndo").textContent).toBe("true")
      );
      expect(screen.getByTestId("canRedo").textContent).toBe("false");

      // Undo should call command.undo and flip redo availability
      await userEvent.click(screen.getByTestId("undo"));
      await waitFor(() =>
        expect(screen.getByTestId("canRedo").textContent).toBe("true")
      );

      // Redo should call command.do and flip redo back to false
      await userEvent.click(screen.getByTestId("redo"));
      await waitFor(() =>
        expect(screen.getByTestId("canRedo").textContent).toBe("false")
      );
      expect(screen.getByTestId("canUndo").textContent).toBe("true");

      // Clear should reset both to false
      await userEvent.click(screen.getByTestId("clear"));
      await waitFor(() =>
        expect(screen.getByTestId("canUndo").textContent).toBe("false")
      );
      expect(screen.getByTestId("canRedo").textContent).toBe("false");
    });
  });

  describe("UndoRedoProvider coverage - provider function lines", () => {
    test("calls useHistory and provides its instance via context", () => {
      const ConsumerProvider = () => {
        const { canUndo, canRedo } = useUndoRedo();
        return (
          <div>
            <div data-testid="flag">provider-ok</div>
            <div data-testid="undo">{String(canUndo)}</div>
            <div data-testid="redo">{String(canRedo)}</div>
          </div>
        );
      };

      render(
        <UndoRedoProvider>
          <ConsumerProvider />
        </UndoRedoProvider>
      );

      // Assert hook was called (React Strict Effects may double-invoke)
      expect(useHistorySpy).toHaveBeenCalled();

      expect(screen.getByTestId("flag").textContent).toBe("provider-ok");
      expect(screen.getByTestId("undo").textContent).toBe("false");
      expect(screen.getByTestId("redo").textContent).toBe("false");
    });
  });
});
