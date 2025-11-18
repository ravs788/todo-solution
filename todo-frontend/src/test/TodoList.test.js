import React from "react";
import { render, screen, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import TodoList from "../components/TodoList";
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
  const getMock = jest.fn(() => Promise.resolve({ data: mockTodos }));
  const mockAxiosInstance = {
    get: getMock,
    interceptors: {
      request: { use: jest.fn() }
    }
  };
  return {
    create: () => mockAxiosInstance,
    _getMock: getMock
  };
});

describe("TodoList", () => {
  afterEach(() => {
    jest.clearAllMocks();
    require("axios")._getMock.mockImplementation(() => Promise.resolve({ data: mockTodos }));
  });

  beforeEach(() => {
    require("axios")._getMock.mockImplementation(() => Promise.resolve({ data: mockTodos }));
  });

  // ... existing tests ...

  it.skip("renders pagination controls when there are multiple pages", async () => {
    // Create enough todos to trigger pagination
    const manyTodos = Array(15).fill().map((_, index) => ({
      id: index + 1,
      title: `Todo ${index + 1}`,
      completed: false,
      startDate: "2023-08-12T10:00:00Z",
    }));
    require("axios")._getMock.mockImplementationOnce(() => {
      return Promise.resolve({ data: manyTodos });
    });

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
    expect(screen.getByText(/Page 1 of/i)).toBeInTheDocument();
    const prevButton = screen.getByText(/Prev/i);
    const nextButton = screen.getByText(/Next/i);
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
    require("axios")._getMock.mockImplementationOnce(() => Promise.resolve({ data: manyTodos }));

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
    await screen.findByText(/Page 1 of/i); // Ensure pagination is rendered and page count is present
    const nextButton = screen.getByText(/Next/i);
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
        reminderAt: "2025-11-10T10:00:00Z", // past
      },
      {
        id: 2,
        title: "Upcoming Task",
        completed: false,
        startDate: "2023-08-13T08:00:00Z",
        reminderAt: "2025-12-20T10:00:00Z", // future, more than 7 days
      },
      {
        id: 3,
        title: "No Reminder Task",
        completed: false,
        startDate: "2023-08-13T08:00:00Z",
        reminderAt: null,
      },
    ];

    require("axios")._getMock.mockImplementationOnce(() => Promise.resolve({ data: todosWithReminders }));

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

    // Wait for the first todo title to appear
    await screen.findByText("Overdue Task");

    // Check for overdue indicator (red, bold)
    expect(screen.getByText("Overdue")).toBeInTheDocument();
    expect(screen.getByText("Overdue")).toHaveStyle("color: red");

    // Check for upcoming indicator (green)
    expect(screen.getByText("Upcoming")).toBeInTheDocument();
    expect(screen.getByText("Upcoming")).toHaveStyle("color: green");

    // Check for no reminder (None)
    expect(screen.getByText("None")).toBeInTheDocument();
  });
});
