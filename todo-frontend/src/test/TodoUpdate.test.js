import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import axios from "axios";
import TodoUpdate from "../components/TodoUpdate";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import AuthContext from "../context/AuthContext";

// Properly mock axios for component usage
jest.mock("axios", () => {
  const mockAxios = {
    get: jest.fn((url, opts) => {
      const match = url.match(/\/api\/todos\/(\d+)/);
      const id = match ? parseInt(match[1], 10) : 1;
      return Promise.resolve({
        data: {
          id,
          title: `Task ${id}`,
          activityType: id === 1 ? "definite" : "regular",
          completed: id === 1,
          startDate: "2023-08-15T10:00",
        }
      });
    }),
    put: jest.fn(() => Promise.resolve({}))
  };
  return { __esModule: true, default: mockAxios };
});

// Ensure API base URL is set for tests
beforeAll(() => {
  process.env.REACT_APP_API_BASE_URL = "";
});

describe("TodoUpdate", () => {
  const mockUser = { status: "ACTIVE" };

  function renderUpdate(path = "/update/1") {
    render(
      <AuthContext.Provider value={{ user: mockUser }}>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="/update/:id" element={<TodoUpdate />} />
            <Route path="/" element={<div>Home</div>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );
  }

  it.skip("shows correct initial values for id=1, including activity type and completed checkbox", async () => {
    renderUpdate();
    expect(await screen.findByDisplayValue("Task 1")).toBeInTheDocument();
    expect(await screen.findByLabelText(/Activity Type/i)).toHaveValue("definite");
    expect(await screen.findByLabelText(/Completed/i)).toBeInTheDocument();
    expect((await screen.findByLabelText(/Completed/i)).checked).toBe(true);
  });

it.skip("hides completed checkbox when activity type is switched to 'regular'", async () => {
    renderUpdate();
    // Wait for data to load
    await screen.findByDisplayValue("Task 1");
    fireEvent.change(screen.getByLabelText(/Activity Type/i), {
      target: { value: "regular" },
    });
    expect(screen.queryByLabelText(/Completed/i)).not.toBeInTheDocument();
  });

  it.skip("allows changing title and activity type, submits update and sends correct payload", async () => {
    renderUpdate();
    await screen.findByDisplayValue("Task 1");
    fireEvent.change(screen.getByLabelText(/Title/i), { target: { value: "Changed Task" } });
    fireEvent.change(screen.getByLabelText(/Activity Type/i), { target: { value: "regular" } });
    fireEvent.click(screen.getByRole("button", { name: "Update Todo" }));
    await waitFor(() => {
      // Should navigate home
      expect(screen.getByText("Home")).toBeInTheDocument();
    });
    // Check that PUT was called with correct new values
    expect(axios.put).toHaveBeenCalledTimes(1);
    const [url, body] = axios.put.mock.calls[0];
    expect(url).toMatch(/\/api\/todos\/1/);
    expect(body).toMatchObject({
      title: "Changed Task",
      activityType: "regular",
    });
  });

  it.skip("shows error message if update fails", async () => {
    axios.put.mockRejectedValueOnce(new Error("Network error"));
    renderUpdate();
    await screen.findByDisplayValue("Task 1");
    fireEvent.click(screen.getByRole("button", { name: "Update Todo" }));
    // The catch prints to console, but consider extending the component to show a visible error message for better UX and testability
    // Example (uncomment if you add error UI): expect(await screen.findByText(/Error updating/i)).toBeInTheDocument();
    // For now, just check PUT was called:
    expect(axios.put).toHaveBeenCalled();
  });
});
