import "@testing-library/jest-dom";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Login from "./Login";
import { AuthProvider } from "../context/AuthContext";

describe("Login Component", () => {
  it("renders username and password inputs and login button", () => {
    render(
      <AuthProvider>
        <Login />
      </AuthProvider>
    );
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
  });

  it("calls onLogin with a token when valid credentials are entered", async () => {
    // Mock fetch to simulate backend response
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => "TEST_TOKEN"
    });

    const mockLogin = jest.fn();
    render(
      <AuthProvider>
        <Login onLogin={mockLogin} />
      </AuthProvider>
    );

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: "user1" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "pass1" } });
    fireEvent.click(screen.getByRole("button", { name: /login/i }));

    // Wait for possible async code; tick event loop
    await screen.findByLabelText(/username/i);

    expect(mockLogin).toHaveBeenCalledWith("TEST_TOKEN");

    // Cleanup fetch mock
    global.fetch.mockRestore();
  });

  it("shows error with invalid credentials", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false });
    render(
      <AuthProvider>
        <Login />
      </AuthProvider>
    );

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: "failuser" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "badpass" } });
    fireEvent.click(screen.getByRole("button", { name: /login/i }));

    expect(await screen.findByText(/invalid username or password/i)).toBeInTheDocument();
    global.fetch.mockRestore();
  });
});
