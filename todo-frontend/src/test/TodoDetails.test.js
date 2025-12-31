import "@testing-library/jest-dom";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AuthContext from "../context/AuthContext";
import { MemoryRouter } from "react-router-dom";

// Mock react-router-dom hooks, but keep real components like MemoryRouter/Link
jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return {
    ...actual,
    useParams: jest.fn(),
    useNavigate: jest.fn()
  };
});
const { useParams, useNavigate } = require("react-router-dom");

// Mock axios ESM safely and expose mock create/get functions
const mockAxiosCreate = jest.fn();
const mockAxiosGet = jest.fn();
jest.mock("axios", () => ({
  __esModule: true,
  default: {
    create: (...args) => mockAxiosCreate(...args)
  }
}));

describe("TodoDetails Component", () => {
  const OLD_ENV = process.env;
  let navigateSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    // default router hooks
    useParams.mockReturnValue({ id: "42" });
    navigateSpy = jest.fn();
    useNavigate.mockReturnValue(navigateSpy);

    // Provide axios.create() return with get and interceptors.request.use
    mockAxiosCreate.mockReturnValue({
      get: mockAxiosGet,
      interceptors: { request: { use: jest.fn() } }
    });

    // default env
    process.env = { ...OLD_ENV, REACT_APP_API_BASE_URL: "http://api.example.com" };
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  const renderWithProviders = (ui, { user } = {}) => {
    return render(
      <MemoryRouter>
        <AuthContext.Provider value={{ user }}>
          {ui}
        </AuthContext.Provider>
      </MemoryRouter>
    );
  };

  test("loads and displays todo details with user actions; Back button navigates", async () => {
    const todo = {
      id: "42",
      title: "My Todo",
      completed: false,
      startDate: "2024-01-05T00:00:00.000Z",
      endDate: "2024-02-10T00:00:00.000Z",
      tags: [{ name: "work" }, "urgent"]
    };
    mockAxiosGet.mockResolvedValueOnce({ data: todo });

    // Import after mocks setup so axios.create is applied
    const TodoDetails = require("../components/TodoDetails").default;

    renderWithProviders(<TodoDetails />, { user: { status: "ACTIVE" } });

    // Shows loading first
    expect(screen.getByText(/Loading.../i)).toBeInTheDocument();

    // Then renders details
    await screen.findByText(/Todo Details/i);
    await waitFor(() => expect(screen.queryByText(/Loading.../i)).not.toBeInTheDocument());
    expect(screen.getByText("My Todo")).toBeInTheDocument();
    // Completed
    expect(screen.getByText(/Completed/i)).toBeInTheDocument();
    expect(screen.getByText("No")).toBeInTheDocument();
    // Dates formatted
    expect(screen.getByText("05-Jan-2024")).toBeInTheDocument();
    expect(screen.getByText("10-Feb-2024")).toBeInTheDocument();
    // Tags rendered
    expect(screen.getByText("work")).toBeInTheDocument();
    expect(screen.getByText("urgent")).toBeInTheDocument();

    // Back navigates -1
    fireEvent.click(screen.getByRole("button", { name: /Back/i }));
    expect(navigateSpy).toHaveBeenCalledWith(-1);

    // Update/Delete links visible when user exists
    expect(screen.getByRole("link", { name: /Update/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Delete/i })).toBeInTheDocument();
  });

  test("sets __recentTodoDelete when Delete link is clicked", async () => {
    const todo = {
      id: "99",
      title: "Deletable",
      completed: true,
      startDate: "2024-03-01T00:00:00.000Z",
      endDate: "2024-03-05T00:00:00.000Z",
      tags: ["alpha", { name: "beta" }]
    };
    mockAxiosGet.mockResolvedValueOnce({ data: todo });
    const TodoDetails = require("../components/TodoDetails").default;

    // Clear any previous global
    delete window.__recentTodoDelete;

    renderWithProviders(<TodoDetails />, { user: { status: "ACTIVE" } });

    expect(await screen.findByText("Deletable")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("link", { name: /Delete/i }));

    await waitFor(() => {
      expect(window.__recentTodoDelete).toEqual({
        title: "Deletable",
        completed: true,
        startDate: "2024-03-01T00:00:00.000Z",
        endDate: "2024-03-05T00:00:00.000Z",
        tags: ["alpha", { name: "beta" }]
      });
    });
  });

  test("shows error message when loading fails", async () => {
    mockAxiosGet.mockRejectedValueOnce(new Error("network"));
    const TodoDetails = require("../components/TodoDetails").default;

    renderWithProviders(<TodoDetails />, { user: { status: "ACTIVE" } });

    expect(await screen.findByText(/Unable to load todo details\./i)).toBeInTheDocument();
  });
});
