import React from "react";
import { render, screen, act } from "@testing-library/react";
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

let mockedData = mockTodos;

jest.mock("axios", () => ({
  create: jest.fn(() => ({
    get: jest.fn(() => Promise.resolve({ data: mockedData })),
    interceptors: {
      request: { use: jest.fn() }
    }
  }))
}));

describe("TodoList", () => {
  afterEach(() => {
    jest.clearAllMocks();
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
    expect(screen.getByText(/Page 1 of/i)).toBeInTheDocument();
    const prevButton = screen.getByText(/Prev/i);
    const nextButton = screen.getByText(/Next/i);
    expect(prevButton).toBeDisabled();
    expect(nextButton).not.toBeDisabled();
  });

  it.skip("updates pagination when next button is clicked", async () => {
    // Create enough todos to trigger pagination
    const manyTodos = Array(15).fill().map((_, index) => ({
      id: index + 1,
      title: `Todo ${index + 1}`,
      completed: false,
      startDate: "2023-08-12T10:00:00Z",
    }));

    // Mock axios instance for this test
    const mockAxiosInstance = {
      get: jest.fn(() => Promise.resolve({ data: manyTodos })),
      interceptors: {
        request: { use: jest.fn() }
      }
    };

    require("axios").create.mockReturnValueOnce(mockAxiosInstance);

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

    // Ensure axios returns our reminder-specific data for this render
    mockedData = todosWithReminders;
    require("axios").create.mockReturnValueOnce({
      get: jest.fn(() => Promise.resolve({ data: todosWithReminders })),
      interceptors: { request: { use: jest.fn() } }
    });

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

    // Wait for rows by accessible name to ensure fetch/render completed
    const overdueRow = await screen.findByRole("row", { name: /Todo:\s*Overdue Task.*reminder overdue/i });
    expect(overdueRow).toBeInTheDocument();

    const upcomingRow = await screen.findByRole("row", { name: /Todo:\s*Upcoming Task.*reminder upcoming/i });
    expect(upcomingRow).toBeInTheDocument();

    const noneRow = await screen.findByRole("row", { name: /Todo:\s*No Reminder Task.*reminder none/i });
    expect(noneRow).toBeInTheDocument();
  });
});
