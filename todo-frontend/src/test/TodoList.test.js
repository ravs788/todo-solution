import React from "react";
import { render, screen, act, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import { ThemeProvider } from "../context/ThemeContext";
import { ToastProvider } from "../context/ToastContext";

// Mock data
const mockTodos = [
  {
    id: 1,
    title: "First Task",
    completed: false,
    startDate: "2023-08-12T10:00:00Z",
    reminderAt: null,
  },
  {
    id: 2,
    title: "Second Task",
    completed: true,
    startDate: "2023-08-13T08:00:00Z",
    reminderAt: "2023-08-14T10:00:00Z", // future
  },
];


jest.mock("axios", () => {
  const mockGet = jest.fn();
  const instance = {
    get: (...args) => mockGet(...args),
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
  };
});

describe("TodoList", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  beforeEach(() => {
    const axiosModule = require("axios");
    axiosModule.__mockGet.mockReset();
  });

  // ... existing tests ...

  it("renders pagination controls when there are multiple pages", async () => {
    // Create enough todos to trigger pagination
    const manyTodos = Array.from({ length: 15 }, (_, index) => ({
      id: index + 1,
      title: `Todo ${index + 1}`,
      completed: false,
      startDate: "2023-08-12T10:00:00Z",
    }));

    // Configure mock per test with fresh module instances
    const axiosModule = require("axios");
    axiosModule.__mockGet.mockResolvedValue({ data: manyTodos });
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

    await screen.findByText(/Todo List/i);
    // Force a refresh event to trigger fetchTodos in case initial effect timing differs
    await act(async () => {
      await Promise.resolve();
      window.dispatchEvent(new Event("refresh-todos"));
    });
    await screen.findByRole("row", { name: /Todo:\s*Todo 1,/i });
    await screen.findByText(/Page 1 of/i);
    const prevButton = screen.getByRole("button", { name: /Previous/i });
    const nextButton = screen.getByRole("button", { name: /Next/i });
    expect(prevButton).toBeDisabled();
    expect(nextButton).not.toBeDisabled();
  });

  it("updates pagination when next button is clicked", async () => {
    // Create enough todos to trigger pagination
    const manyTodos = Array(15).fill().map((_, index) => ({
      id: index + 1,
      title: `Todo ${index + 1}`,
      completed: false,
      startDate: "2023-08-12T10:00:00Z",
    }));

    // Configure mock per test with fresh module instances
    const axiosModule = require("axios");
    axiosModule.__mockGet.mockResolvedValue({ data: manyTodos });
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

    await screen.findByText(/Todo List/i);
    // Force a refresh event to trigger fetchTodos in case initial effect timing differs
    await act(async () => {
      await Promise.resolve();
      window.dispatchEvent(new Event("refresh-todos"));
    });
    await screen.findByRole("row", { name: /Todo:\s*Todo 1,/i });
    await screen.findByText(/Page 1 of/i); // Ensure pagination is rendered and page count is present
    const nextButton = screen.getByRole("button", { name: /Next/i });
    // Important: Use act and then waitFor the DOM to update to page 2
    await act(async () => {
      nextButton.click();
    });
    await screen.findByText(/Page 2 of/i);
    expect(screen.getByText(/Page 2 of/i)).toBeInTheDocument();
  });

  it("displays reminder status indicators correctly", async () => {
    // Mock todos with different reminder times
    const todosWithReminders = [
      {
        id: 1,
        title: "Overdue Task",
        completed: false,
        startDate: "2023-08-12T10:00:00Z",
        reminderAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // past (1 day)
      },
      {
        id: 2,
        title: "Upcoming Task",
        completed: false,
        startDate: "2023-08-13T08:00:00Z",
        reminderAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // future, more than 7 days
      },
      {
        id: 3,
        title: "No Reminder Task",
        completed: false,
        startDate: "2023-08-13T08:00:00Z",
        reminderAt: null,
      },
    ];

    // Configure mock per test with fresh module instances
    const axiosModule = require("axios");
    axiosModule.__mockGet.mockResolvedValue({ data: todosWithReminders });
    const TodoList = require("../components/TodoList").default;

    render(
      <ThemeProvider>
        <ToastProvider>
          <AuthContext.Provider value={{ user: { status: "ACTIVE" } }}>
            <MemoryRouter>
              <TodoList />
            </MemoryRouter>
          </AuthContext.Provider>
        </ToastProvider>
      </ThemeProvider>
    );

    await screen.findByText(/Todo List/i);
    // Force a refresh event to trigger fetchTodos in case initial effect timing differs
    await act(async () => {
      await Promise.resolve();
      window.dispatchEvent(new Event("refresh-todos"));
    });
    // Wait for one of the todo titles to appear to confirm data rendered
    await screen.findByText("Overdue Task");

    // Wait for rows by accessible name to ensure fetch/render completed
    const overdueRow = await screen.findByRole("row", { name: /Todo:\s*Overdue Task,\s*not completed,\s*reminder\s*overdue/i });
    expect(overdueRow).toBeInTheDocument();

    const upcomingRow = await screen.findByRole("row", { name: /Todo:\s*Upcoming Task,\s*not completed,\s*reminder\s*upcoming/i });
    expect(upcomingRow).toBeInTheDocument();

    const noneRow = await screen.findByRole("row", { name: /Todo:\s*No Reminder Task,\s*not completed,\s*reminder\s*none/i });
    expect(noneRow).toBeInTheDocument();
  });
});
