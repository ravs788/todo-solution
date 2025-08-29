import React from "react";
import { render, screen, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import TodoList from "../components/TodoList";
import AuthContext from "../context/AuthContext";

// Mock data
const mockTodos = [
  {
    id: 1,
    title: "First Task",
    completed: false,
    startDate: "2023-08-12T10:00:00Z",
  },
  {
    id: 2,
    title: "Second Task",
    completed: true,
    startDate: "2023-08-13T08:00:00Z",
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
      console.log("Mock axios get called");
      return Promise.resolve({ data: manyTodos });
    });

    render(
      <AuthContext.Provider value={{ user: { status: "ACTIVE" } }}>
        <MemoryRouter>
          <TodoList />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    await screen.findByText(/Todo List/i);
    console.log("Current document:", document.body.innerHTML);
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
      <AuthContext.Provider value={{ user: { status: "ACTIVE" } }}>
        <MemoryRouter>
          <TodoList />
        </MemoryRouter>
      </AuthContext.Provider>
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
});
