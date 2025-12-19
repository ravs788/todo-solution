/* eslint-disable */
// @ts-nocheck
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from 'react-router-dom';
import AdminPanel from "../components/AdminPanel";

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
  // Mock window.innerWidth for consistent pageSize
  Object.defineProperty(window, "innerWidth", {
    value: 1024,
    writable: true,
  });
});

describe('unit', () => {
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

render(
  <MemoryRouter>
    <AdminPanel />
  </MemoryRouter>
);
      expect(screen.getByText(/Admin Panel/i)).toBeInTheDocument();
      expect(fetch).toHaveBeenCalled();
      expect(await screen.findByText(/No active users/i)).toBeInTheDocument();

      // Now test for pending users view as well:
      fireEvent.change(screen.getByLabelText(/View:/i), {
        target: { value: "PENDING" }
      });
      expect(await screen.findByText(/No users pending approval/i)).toBeInTheDocument();
    });

it("renders a list of pending users with approve buttons", async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { id: 98, username: "activeuser", status: "ACTIVE" },
          { id: 99, username: "pendinguser", status: "PENDING" }
        ],
      });

      render(
        <MemoryRouter>
          <AdminPanel />
        </MemoryRouter>
      );
      // Switch to pending users tab using dropdown
      fireEvent.change(screen.getByLabelText(/View:/i), {
        target: { value: "PENDING" }
      });
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
      render(
        <MemoryRouter>
          <AdminPanel />
        </MemoryRouter>
      );
      expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
      resolve({ ok: true, json: async () => [] });
      await waitFor(() =>
        expect(screen.queryByText(/Loading.../i)).not.toBeInTheDocument()
      );
    });

    it("approves user and removes from list", async () => {
      // Initial fetch: only pending user (no active, so auto-switches to PENDING)
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

      render(
        <MemoryRouter>
          <AdminPanel />
        </MemoryRouter>
      );
      // Wait for auto-switch to PENDING view if needed, then ensure "approve_me" is visible
      expect(await screen.findByText(/approve_me/i)).toBeInTheDocument();

      const approveBtn = screen.getByRole('button', { name: /Approve/i });
      fireEvent.click(approveBtn);

      // Wait for the list to update and show empty state
      expect(await screen.findByText(/No users pending approval/i)).toBeInTheDocument();
      expect(screen.queryByText(/approve_me/i)).not.toBeInTheDocument();
    });
  });
});
