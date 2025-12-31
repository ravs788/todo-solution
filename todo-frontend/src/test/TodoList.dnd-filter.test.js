import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider } from "../context/ThemeContext";
import { ToastProvider } from "../context/ToastContext";
import AuthContext from "../context/AuthContext";

/**
 * Mock axios.create() instance used by TodoList as `api`.
 * We expose __mockGet and __mockPut so tests can control responses.
 */
jest.mock("axios", () => {
  const mockGet = jest.fn();
  const mockPut = jest.fn();
  const instance = {
    get: (...args) => mockGet(...args),
    put: (...args) => mockPut(...args),
    interceptors: {
      request: { use: jest.fn() },
    },
  };
  const create = jest.fn(() => instance);
  return {
    __esModule: true,
    default: { create },
    create,
    __mockGet: mockGet,
    __mockPut: mockPut,
  };
});

describe("TodoList - filters and drag-and-drop branches", () => {
  beforeEach(() => {
    const axiosModule = require("axios");
    axiosModule.__mockGet.mockReset();
    axiosModule.__mockPut.mockReset();
    // Ensure environment base is set to avoid accidental network calls
    process.env.REACT_APP_API_BASE_URL = "";
    // Clear localStorage effects if any
    localStorage.clear();
  });

  function renderListWith(todos) {
    const axiosModule = require("axios");
    axiosModule.__mockGet.mockResolvedValue({ data: todos });
    const TodoList = require("../components/TodoList").default;

    render(
      <ThemeProvider>
        <AuthContext.Provider value={{ user: { status: "ACTIVE" } }}>
          <ToastProvider>
            <MemoryRouter>
              <TodoList />
            </MemoryRouter>
          </ToastProvider>
        </AuthContext.Provider>
      </ThemeProvider>
    );
  }

  test("filters by completed status: All, Completed, Not Completed branches", async () => {
    const todos = [
      { id: 1, title: "A", completed: true, startDate: "2023-08-12T10:00:00Z" },
      { id: 2, title: "B", completed: false, startDate: "2023-08-12T10:00:00Z" },
      { id: 3, title: "C", completed: false, startDate: "2023-08-12T10:00:00Z" },
    ];
    renderListWith(todos);

    // Wait for initial load
    await screen.findByText(/Todo List/i);
    await screen.findByRole("row", { name: /Todo:\s*A,\s*completed/i });
    await screen.findByRole("row", { name: /Todo:\s*B,\s*not completed/i });

    // Switch to Completed (true)
    const statusSelect = screen.getByLabelText(/Filter by Completion Status/i);
    fireEvent.change(statusSelect, { target: { value: "true" } });

    // Only completed visible
    expect(await screen.findByRole("row", { name: /Todo:\s*A,\s*completed/i })).toBeInTheDocument();
    expect(screen.queryByRole("row", { name: /Todo:\s*B,\s*not completed/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("row", { name: /Todo:\s*C,\s*not completed/i })).not.toBeInTheDocument();

    // Switch to Not Completed (false)
    fireEvent.change(statusSelect, { target: { value: "false" } });
    expect(await screen.findByRole("row", { name: /Todo:\s*B,\s*not completed/i })).toBeInTheDocument();
    expect(screen.getByRole("row", { name: /Todo:\s*C,\s*not completed/i })).toBeInTheDocument();
    expect(screen.queryByRole("row", { name: /Todo:\s*A,\s*completed/i })).not.toBeInTheDocument();

    // Back to All ("")
    fireEvent.change(statusSelect, { target: { value: "" } });
    expect(await screen.findByRole("row", { name: /Todo:\s*A,\s*completed/i })).toBeInTheDocument();
    expect(screen.getByRole("row", { name: /Todo:\s*B,\s*not completed/i })).toBeInTheDocument();
    expect(screen.getByRole("row", { name: /Todo:\s*C,\s*not completed/i })).toBeInTheDocument();
  });

  test("drag-and-drop reorder success calls api.put('/todos/reorder', newOrder)", async () => {
    const todos = [
      { id: 1, title: "First Task", completed: false, startDate: "2023-08-12T10:00:00Z" },
      { id: 2, title: "Second Task", completed: false, startDate: "2023-08-12T10:00:00Z" },
    ];
    renderListWith(todos);

    await screen.findByText(/Todo List/i);

    const row1 = await screen.findByRole("row", { name: /Todo:\s*First Task,/i });
    const row2 = await screen.findByRole("row", { name: /Todo:\s*Second Task,/i });

    fireEvent.dragStart(row1);
    fireEvent.dragOver(row2);
    fireEvent.drop(row2);

    const axiosModule = require("axios");
    await waitFor(() => expect(axiosModule.__mockPut).toHaveBeenCalledTimes(1));
    expect(axiosModule.__mockPut).toHaveBeenCalledWith("/todos/reorder", [2, 1]);

    // DOM reflects optimistic reorder (Second Task should appear before First Task)
    const dataRows = screen
      .getAllByRole("row")
      .filter((r) => (r.getAttribute("aria-label") || "").startsWith("Todo:"));
    expect(dataRows[0]).toHaveAccessibleName(/Second Task/);
  });

  test("drag-and-drop same source/target is a no-op (no put)", async () => {
    const todos = [
      { id: 1, title: "Alpha", completed: false, startDate: "2023-08-12T10:00:00Z" },
      { id: 2, title: "Beta", completed: false, startDate: "2023-08-12T10:00:00Z" },
    ];
    renderListWith(todos);

    await screen.findByText(/Todo List/i);

    const row1 = await screen.findByRole("row", { name: /Todo:\s*Alpha,/i });

    fireEvent.dragStart(row1);
    fireEvent.dragOver(row1);
    fireEvent.drop(row1);

    const axiosModule = require("axios");
    expect(axiosModule.__mockPut).not.toHaveBeenCalled();
  });

  test("drag-and-drop reorder failure reverts UI order", async () => {
    const todos = [
      { id: 1, title: "One", completed: false, startDate: "2023-08-12T10:00:00Z" },
      { id: 2, title: "Two", completed: false, startDate: "2023-08-12T10:00:00Z" },
    ];
    renderListWith(todos);

    await screen.findByText(/Todo List/i);

    const axiosModule = require("axios");
    axiosModule.__mockPut.mockRejectedValueOnce(new Error("reorder failed"));

    const row1 = await screen.findByRole("row", { name: /Todo:\s*One,/i });
    const row2 = await screen.findByRole("row", { name: /Todo:\s*Two,/i });

    fireEvent.dragStart(row1);
    fireEvent.dragOver(row2);
    fireEvent.drop(row2);

    // After failure, UI should revert to original order (One then Two)
    await waitFor(() => {
      const rows = screen
        .getAllByRole("row")
        .filter((r) => (r.getAttribute("aria-label") || "").startsWith("Todo:"));
      expect(rows[0]).toHaveAccessibleName(/One/);
    });
    const rows = screen
      .getAllByRole("row")
      .filter((r) => (r.getAttribute("aria-label") || "").startsWith("Todo:"));
    expect(rows[1]).toHaveAccessibleName(/Two/);
  });
});
