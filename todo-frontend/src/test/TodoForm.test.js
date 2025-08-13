import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import TodoForm from "../components/TodoForm";
import AuthContext from "../context/AuthContext";

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

// Mock axios
jest.mock("axios", () => ({
  post: jest.fn(() => Promise.resolve({ data: {} })),
}));

describe("TodoForm", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it.skip("renders the Create Todo form", () => {
    render(
      <AuthContext.Provider value={{ user: { status: "ACTIVE" } }}>
        <MemoryRouter>
          <TodoForm />
        </MemoryRouter>
      </AuthContext.Provider>
    );
    expect(screen.getByText(/Create Todo/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter todo title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Completed/i)).toBeInTheDocument();
    expect(screen.getByText(/Create Todo/i, { selector: "button" })).toBeInTheDocument();
    expect(screen.getByText(/Back/i)).toBeInTheDocument();
  });

  it.skip("shows pending approval message if user.status is PENDING", () => {
    render(
      <AuthContext.Provider value={{ user: { status: "PENDING" } }}>
        <MemoryRouter>
          <TodoForm />
        </MemoryRouter>
      </AuthContext.Provider>
    );
    expect(screen.getByText(/Account Pending Approval/i)).toBeInTheDocument();
    expect(screen.getByText(/registration is successful/i)).toBeInTheDocument();
  });

  it.skip("calls navigate('/') when Back button is clicked", () => {
    render(
      <AuthContext.Provider value={{ user: { status: "ACTIVE" } }}>
        <MemoryRouter>
          <TodoForm />
        </MemoryRouter>
      </AuthContext.Provider>
    );
    fireEvent.click(screen.getByText(/Back/i));
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });

  it.skip("submits form, calls axios.post and navigates to /", async () => {
    const { default: axios } = await import("axios");
    render(
      <AuthContext.Provider value={{ user: { status: "ACTIVE" } }}>
        <MemoryRouter>
          <TodoForm />
        </MemoryRouter>
      </AuthContext.Provider>
    );
    fireEvent.change(screen.getByPlaceholderText(/Enter todo title/i), { target: { value: "Test Todo" } });
    fireEvent.change(screen.getByLabelText(/Start Date/i), {
      target: { value: "2023-08-13T12:00" },
    });
    fireEvent.click(screen.getByText(/Create Todo/i, { selector: "button" }));
    // Wait for async .then()
    await Promise.resolve();
    expect(axios.post).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });
});
