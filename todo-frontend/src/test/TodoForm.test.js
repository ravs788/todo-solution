import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import TodoForm from "../components/TodoForm";
// Add this line to import axios
import axios from 'axios';
import AuthContext from "../context/AuthContext";
// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

const mockAxios = {
  get: jest.fn(() => Promise.resolve({ data: [] })),
  post: jest.fn(() => Promise.resolve({ data: {} }))
};
jest.mock("axios", () => mockAxios);

describe("TodoForm", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it.skip("handles tag input correctly", async () => {
    render(
      <AuthContext.Provider value={{ user: { status: "ACTIVE" } }}>
        <MemoryRouter>
          <TodoForm />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    const tagInput = screen.getByPlaceholderText(/Add tag/i);
    const titleInput = screen.getByPlaceholderText(/Enter todo title/i);
    const startDateInput = screen.getByLabelText(/Start Date/i);
    const createButton = screen.getByText(/Create Todo/i, { selector: "button" });

    // Enter todo details
    fireEvent.change(titleInput, { target: { value: "Test Todo with tags" } });
    fireEvent.change(startDateInput, { target: { value: "2023-08-13T12:00" } });

    // Add a new tag
    fireEvent.change(tagInput, { target: { value: "new-tag" } });
    fireEvent.keyDown(tagInput, { key: "Enter" });

    // Wait for the tag to be added
    await waitFor(() => {
      expect(screen.getByText("new-tag")).toBeInTheDocument();
    });

    // Verify the tag input is cleared
    expect(tagInput).toHaveValue("");

    // Simulate form submission
    const axiosPostSpy = jest.spyOn(axios, 'post');
    fireEvent.click(createButton);

    // Wait for the axios post request to be called
    await waitFor(() => {
      expect(axiosPostSpy).toHaveBeenCalledTimes(1);
    });

    // Check if the tag was included in the payload
    expect(axiosPostSpy.mock.calls[0][1].tags).toEqual(["new-tag"]);

    // Clean up
    axiosPostSpy.mockRestore();
  });

  it.skip("uses existing tag suggestions correctly", async () => {
    // Mock the axios get request for tag suggestions
    const axiosGetSpy = jest.spyOn(axios, 'get').mockImplementationOnce(() =>
      Promise.resolve({ data: ["existing-tag"] })
    );

    render(
      <AuthContext.Provider value={{ user: { status: "ACTIVE" } }}>
        <MemoryRouter>
          <TodoForm />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    const tagInput = screen.getByPlaceholderText(/Add tag/i);

    // Enter a value to trigger suggestions
    fireEvent.change(tagInput, { target: { value: "existing" } });

    // Wait for suggestions to appear
    await screen.findByText("existing-tag");

    // Check if the suggestion is displayed
    expect(screen.getByText("existing-tag")).toBeInTheDocument();

    // Clean up
    axiosGetSpy.mockRestore();
  });

  it("renders the Create Todo form", async () => {
    render(
      <AuthContext.Provider value={{ user: { status: "ACTIVE" } }}>
        <MemoryRouter>
          <TodoForm />
        </MemoryRouter>
      </AuthContext.Provider>
    );
    // await waitFor(() => {
    //   expect(screen.getByText(/Create Todo/i)).toBeInTheDocument();
    // });
    expect(screen.getByPlaceholderText(/Enter todo title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Completed/i)).toBeInTheDocument();
    expect(screen.getByText(/Create Todo/i, { selector: "button" })).toBeInTheDocument();
    expect(screen.getByText(/Back/i)).toBeInTheDocument();
  });

  it("shows pending approval message if user.status is PENDING", () => {
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

  it("calls navigate('/') when Back button is clicked", () => {
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
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });
});
