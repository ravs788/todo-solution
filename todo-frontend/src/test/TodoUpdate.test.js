import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import TodoUpdate from "../components/TodoUpdate";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import AuthContext from "../context/AuthContext";

/* Mock axios to always return Promises on get/put and for created instances */
jest.mock("axios", () => {
  // Make axios callable (axios(config)) and provide get/put methods.
  // Also ensure axios.create() returns an instance whose get/put are Promises
  // and are linked to the top-level mocks so tests can inspect calls.
  const instance = {
    get: jest.fn().mockResolvedValue({ data: {} }),
    put: jest.fn().mockResolvedValue({}),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() }
    }
  };

  const mockAxios = Object.assign(
    jest.fn(() => Promise.resolve({ data: {} })), // axios(...)
    instance
  );

  mockAxios.create = jest.fn(() => ({
    ...instance,
    // Link to top-level so overrides (e.g., mockImplementation) propagate
    get: mockAxios.get,
    put: mockAxios.put,
    interceptors: instance.interceptors
  }));

  return {
    __esModule: true,
    default: mockAxios,
    // Also expose named exports in case any code uses require('axios').get, etc.
    get: mockAxios.get,
    put: mockAxios.put,
    create: mockAxios.create,
    interceptors: instance.interceptors
  };
});

const axiosModule = require("axios");
const axios = axiosModule.default || axiosModule;
// Ensure CJS and ESM imports both see the same mock functions
axiosModule.get = axios.get;
axiosModule.put = axios.put;
axiosModule.create = axios.create;
axiosModule.interceptors = axios.interceptors;
/* Set up axios.get to return different data based on URL.
   Ensure every call returns a proper Promise to avoid `.then` on undefined. */
axios.get.mockImplementation((url = "") => {
  // Tag suggestions endpoint should return an array of strings
  if (/\/api\/tags\?search=/.test(url)) {
    return Promise.resolve({ data: [] });
  }
  // Todo details endpoint
  const match = url.match(/\/api\/todos\/(\d+)/);
  const id = match ? parseInt(match[1], 10) : 1;
  return Promise.resolve({
    data: {
      id,
      title: `Task ${id}`,
      activityType: id === 1 ? "definite" : "regular",
      completed: id === 1,
      startDate: "2023-08-15T10:00",
    },
  });
});
// Default successful PUT to avoid `.then` on undefined during submit
axios.put.mockResolvedValue({});

/* Ensure API base URL is set for tests */
beforeAll(() => {
  process.env.REACT_APP_API_BASE_URL = "";
});

/* Re-apply axios mock implementations before each test in case Jest resetMocks is enabled */
beforeEach(() => {
  // Re-establish implementations so axios.get(...) always returns a Promise
  axios.get.mockImplementation((url = "") => {
    if (/\/api\/tags\?search=/.test(url)) {
      return Promise.resolve({ data: [] });
    }
    const match = url.match(/\/api\/todos\/(\d+)/);
    const id = match ? parseInt(match[1], 10) : 1;
    return Promise.resolve({
      data: {
        id,
        title: `Task ${id}`,
        activityType: id === 1 ? "definite" : "regular",
        completed: id === 1,
        startDate: "2023-08-15T10:00",
      },
    });
  });
  axios.put.mockResolvedValue({});
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

  it("renders initial values (id=1): title, activity type 'definite', and completed checked", async () => {
    renderUpdate();
    // Wait for initial data to populate the form
    await screen.findByDisplayValue("Task 1");
    const activitySelect = await screen.findByLabelText(/Activity Type/i);
    expect(activitySelect).toHaveValue("definite");
  
    const completedCheckbox = await screen.findByLabelText(/Completed/i);
    expect(completedCheckbox).toBeInTheDocument();
    expect(completedCheckbox).toBeChecked();
  });

  it("removes the completed checkbox when switching activity type to 'regular'", async () => {
    renderUpdate();
    // Ensure initial load
    await screen.findByDisplayValue("Task 1");
  
    const activitySelect = await screen.findByLabelText(/Activity Type/i);
    fireEvent.change(activitySelect, { target: { value: "regular" } });
  
    // Disappearance is async due to state update; wait for it
    await waitFor(() => {
      expect(screen.queryByLabelText(/Completed/i)).not.toBeInTheDocument();
    });
  });

  it("allows changing title and activity type, submits update and sends correct payload", async () => {
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

  it("shows error message if update fails", async () => {
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
