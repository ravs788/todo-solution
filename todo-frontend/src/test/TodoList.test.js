import React from "react";
import { render, screen } from "@testing-library/react";
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

// Mock axios
jest.mock("axios", () => ({
  create: () => ({
    get: jest.fn(() => Promise.resolve({ data: mockTodos })),
    interceptors: {
      request: { use: jest.fn() }
    }
  }),
}));

describe("TodoList", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it.skip("renders the Todo List table and todos", async () => {
    render(
      <AuthContext.Provider value={{ user: { status: "ACTIVE" } }}>
        <MemoryRouter>
          <TodoList />
        </MemoryRouter>
      </AuthContext.Provider>
    );
    expect(await screen.findByText(/Todo List/i)).toBeInTheDocument();
    expect(await screen.findByText("First Task")).toBeInTheDocument();
    expect(await screen.findByText("Second Task")).toBeInTheDocument();
    expect(await screen.findByText(/No/i)).toBeInTheDocument();
    expect(await screen.findByText(/Yes/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Update/i, { selector: "a" }).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Delete/i, { selector: "a" }).length).toBeGreaterThan(0);
  });

  it("shows Create New Todo button when user exists", () => {
    render(
      <AuthContext.Provider value={{ user: { status: "ACTIVE" } }}>
        <MemoryRouter>
          <TodoList />
        </MemoryRouter>
      </AuthContext.Provider>
    );
    expect(screen.getByText(/Create New Todo/i)).toBeInTheDocument();
  });

  it("shows pending approval message for PENDING user", () => {
    render(
      <AuthContext.Provider value={{ user: { status: "PENDING" } }}>
        <MemoryRouter>
          <TodoList />
        </MemoryRouter>
      </AuthContext.Provider>
    );
    expect(screen.getByText(/Account Pending Approval/i)).toBeInTheDocument();
    expect(screen.getByText(/registration is successful/i)).toBeInTheDocument();
  });

  it.skip("renders empty table if no todos", async () => {
    // Override mock response for this test
    const { create } = require("axios");
    create.mockReturnValueOnce({
      get: jest.fn(() => Promise.resolve({ data: [] })),
      interceptors: { request: { use: jest.fn() } }
    });
    render(
      <AuthContext.Provider value={{ user: { status: "ACTIVE" } }}>
        <MemoryRouter>
          <TodoList />
        </MemoryRouter>
      </AuthContext.Provider>
    );
    expect(await screen.findByText(/Todo List/i)).toBeInTheDocument();
    // Table body should exist but have no todos
    expect(screen.queryByText("First Task")).not.toBeInTheDocument();
  });
});
