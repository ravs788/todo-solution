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

jest.mock("axios", () => {
  const getMock = jest.fn(() => Promise.resolve({ data: mockTodos }));
  const mockAxiosModule = {
    create: () => ({
      get: getMock,
      interceptors: {
        request: { use: jest.fn() }
      }
    }),
    _getMock: getMock
  };
  return mockAxiosModule;
});

describe("TodoList", () => {
  afterEach(() => {
    jest.clearAllMocks();
    require("axios")._getMock.mockImplementation(() => Promise.resolve({ data: mockTodos }));
  });

  beforeEach(() => {
    require("axios")._getMock.mockImplementation(() => Promise.resolve({ data: mockTodos }));
  });

  it("renders the Todo List table and todos", async () => {
    render(
      <AuthContext.Provider value={{ user: { status: "ACTIVE" } }}>
        <MemoryRouter>
          <TodoList />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    // Await that both todos are rendered
    await screen.findByText(/Todo List/i);
    await screen.findByText("First Task");
    await screen.findByText("Second Task");
    // Use findAllByText to avoid ambiguity with "No" and "Yes" in both options and table cells
    const noCells = await screen.findAllByText(/No/i, { selector: "td" });
    expect(noCells.length).toBeGreaterThan(0);
    const yesCells = await screen.findAllByText(/Yes/i, { selector: "td" });
    expect(yesCells.length).toBeGreaterThan(0);
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

  it("renders empty table if no todos", async () => {
    // Override mock response for this test
    require("axios")._getMock.mockImplementationOnce(() => Promise.resolve({ data: [] }));
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
