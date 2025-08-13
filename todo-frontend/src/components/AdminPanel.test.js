import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AdminPanel from "./AdminPanel";

// LocalStorage mock
beforeAll(() => {
  Object.defineProperty(window, "localStorage", {
    value: {
      getItem: jest.fn(() => "test-token"),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    },
    writable: true,
  });
});

describe("AdminPanel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it("renders and shows no users pending approval", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    render(<AdminPanel />);
    expect(screen.getByText(/Admin Panel/i)).toBeInTheDocument();
    expect(fetch).toHaveBeenCalled();
    expect(await screen.findByText(/No users pending approval/i)).toBeInTheDocument();
  });

  it("renders a list of pending users with approve buttons", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [{ id: 99, username: "pendinguser", status: "PENDING" }],
    });

    render(<AdminPanel />);
    expect(await screen.findByText(/pendinguser/i)).toBeInTheDocument();
    expect(screen.getByText(/Approve/i)).toBeInTheDocument();
  });

  it("shows loading while fetching", async () => {
    let resolve;
    fetch.mockReturnValue(
      new Promise((res) => {
        resolve = res;
      })
    );
    render(<AdminPanel />);
    expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
    resolve({ ok: true, json: async () => [] });
    await waitFor(() =>
      expect(screen.queryByText(/Loading.../i)).not.toBeInTheDocument()
    );
  });

  it.skip("approves user and removes from list", async () => {
    // Initial fetch pending users
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: 42, username: "approve_me", status: "PENDING" }],
      });

    // Approve POST mock
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    render(<AdminPanel />);
    expect(await screen.findByText(/approve_me/i)).toBeInTheDocument();
    const approveBtn = screen.getAllByText(/Approve/i)[0];
    fireEvent.click(approveBtn);

    await waitFor(() =>
      expect(screen.getByText((content) =>
        content.includes('User approved')
      )).toBeInTheDocument()
    );
    expect(screen.getByText(/No users pending approval/i)).toBeInTheDocument();
  });
});
