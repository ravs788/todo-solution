import "@testing-library/jest-dom";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import TodoDelete from "../components/TodoDelete";
import AuthContext from "../context/AuthContext";
import axios from "axios";

/**
 * Mock axios via factory to avoid importing axios ESM from node_modules in Jest.
 * Provides a default export with the methods we use in components/tests.
 */
jest.mock("axios", () => {
  const mockAxios = {
    delete: jest.fn(),
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    create: jest.fn()
  };
  return { __esModule: true, default: mockAxios };
});

/**
 * Mock react-router-dom hooks with in-factory jest.fn()
 * so we can configure return values later via the mocked exports.
 */
jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return {
    ...actual,
    useParams: jest.fn(),
    useNavigate: jest.fn(),
    useLocation: jest.fn()
  };
});
const { useParams, useNavigate, useLocation } = require("react-router-dom");

// Mock ToastContext hook to avoid needing a Provider
jest.mock("../context/ToastContext", () => ({
  useToast: () => ({
    showToast: jest.fn()
  })
}));

// Mock createCommands to control command-based deletion path
const mockCreateCommands = jest.fn();
jest.mock("../hooks/useCommands", () => ({
  createCommands: (...args) => mockCreateCommands(...args)
}));

const renderWithUser = (user) => {
  return render(
    <AuthContext.Provider value={{ user }}>
      <TodoDelete />
    </AuthContext.Provider>
  );
};

describe("TodoDelete Component", () => {
  const OLD_ENV = process.env;
  let navigateSpy;

  beforeAll(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // default router hook values
    useParams.mockReturnValue({ id: "42" });
    navigateSpy = jest.fn();
    useNavigate.mockReturnValue(navigateSpy);
    useLocation.mockReturnValue({ state: {} });
    // reset env
    process.env = { ...OLD_ENV, REACT_APP_API_BASE_URL: "http://api.example.com" };
    // reset localStorage
    localStorage.clear();
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  test("renders pending approval view when user.status is PENDING", () => {
    renderWithUser({ status: "PENDING" });
    expect(screen.getByText(/Account Pending Approval/i)).toBeInTheDocument();
    expect(screen.getByText(/pending approval by an admin/i)).toBeInTheDocument();
  });

  test("command-based delete path: uses createCommands when todoData present in location.state", async () => {
    // Arrange location with todoData
    useLocation.mockReturnValue({
      state: { todoData: { id: "42", title: "Test todo" } }
    });
    // Mock command do/undo
    const doMock = jest.fn().mockResolvedValue(undefined);
    const undoMock = jest.fn().mockResolvedValue(undefined);
    mockCreateCommands.mockReturnValue({
      deleteTodoCommand: (id, todo) => ({
        do: doMock,
        undo: undoMock
      })
    });

    renderWithUser({ status: "ACTIVE" });

    // Act
    fireEvent.click(screen.getByRole("button", { name: /Yes, Delete/i }));

    // Assert - command executed and then navigated home
    expect(doMock).toHaveBeenCalled();
    // navigate called back to "/" after command completes
    // We can't await here as component chains .then, but event loop should flush quickly
    // Still, assert it was scheduled
    await waitFor(() => expect(navigateSpy).toHaveBeenCalledWith("/"));
  });

  test("fallback path: without token, navigate to /login", async () => {
    // No todoData and no token
    useLocation.mockReturnValue({ state: {} });
    localStorage.removeItem("jwtToken");

    renderWithUser({ status: "ACTIVE" });

    fireEvent.click(screen.getByRole("button", { name: /Yes, Delete/i }));

    await waitFor(() => expect(navigateSpy).toHaveBeenCalledWith("/login"));
    expect(axios.delete).not.toHaveBeenCalled();
  });

  test("fallback path: successful axios delete navigates home", async () => {
    // Set token and mock axios success
    localStorage.setItem("jwtToken", "TOKEN");
    axios.delete.mockResolvedValueOnce({ status: 204 });

    renderWithUser({ status: "ACTIVE" });

    fireEvent.click(screen.getByRole("button", { name: /Yes, Delete/i }));

    // Wait a tick for promise chain
    // Using microtask queue via resolved Promise
    await Promise.resolve();

    expect(axios.delete).toHaveBeenCalledWith(
      "http://api.example.com/api/todos/42",
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer TOKEN" })
      })
    );
    expect(navigateSpy).toHaveBeenCalledWith("/");
  });

  test("fallback path: 403 from axios redirects to /login", async () => {
    localStorage.setItem("jwtToken", "TOKEN");
    axios.delete.mockRejectedValueOnce({ response: { status: 403 } });

    renderWithUser({ status: "ACTIVE" });

    fireEvent.click(screen.getByRole("button", { name: /Yes, Delete/i }));

    await waitFor(() => expect(navigateSpy).toHaveBeenCalledWith("/login"));
  });

  test("Cancel button navigates back to home", () => {
    renderWithUser({ status: "ACTIVE" });

    fireEvent.click(screen.getByRole("button", { name: /Cancel/i }));

    expect(navigateSpy).toHaveBeenCalledWith("/");
  });
});
