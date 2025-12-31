import "@testing-library/jest-dom";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Register from "../components/Register";
import { ThemeProvider } from "../context/ThemeContext";

describe("Register Component", () => {
  const OLD_ENV = process.env;
  let fetchSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...OLD_ENV, REACT_APP_API_BASE_URL: "http://api.example.com" };
    fetchSpy = jest.spyOn(global, "fetch").mockImplementation(() => Promise.resolve());
  });

  afterEach(() => {
    process.env = OLD_ENV;
    if (fetchSpy) fetchSpy.mockRestore();
  });

  const renderWithProviders = (ui) => render(<ThemeProvider>{ui}</ThemeProvider>);

  function fillAndSubmit({ username, password, confirm }) {
    if (username !== undefined) {
      fireEvent.change(screen.getByLabelText(/username/i), { target: { value: username } });
    }
    if (password !== undefined) {
      fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: password } });
    }
    if (confirm !== undefined) {
      fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: confirm } });
    }
    fireEvent.click(screen.getByRole("button", { name: /register/i }));
  }

  test("shows validation error when username or password missing", () => {
    renderWithProviders(<Register />);
    fillAndSubmit({ username: "", password: "", confirm: "" });
    expect(screen.getByText(/Username and password are required\./i)).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  test("shows validation error when passwords do not match", () => {
    renderWithProviders(<Register />);
    fillAndSubmit({ username: "u1", password: "p1", confirm: "p2" });
    expect(screen.getByText(/Passwords do not match\./i)).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  test("successful registration clears fields and shows success; calls onRegistered", async () => {
    const onRegistered = jest.fn();
    // Mock fetch ok: true
    fetchSpy.mockResolvedValueOnce({ ok: true });

    renderWithProviders(<Register onRegistered={onRegistered} />);

    fillAndSubmit({ username: "newuser", password: "secret", confirm: "secret" });

    expect(fetchSpy).toHaveBeenCalledWith(
      "http://api.example.com/api/auth/register",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "newuser", password: "secret" })
      })
    );

    // Success message appears
    expect(
      await screen.findByText(/Registration successful\. Your account needs to be approved/i)
    ).toBeInTheDocument();

    // Inputs cleared
    expect(screen.getByLabelText(/username/i)).toHaveValue("");
    expect(screen.getByLabelText(/^password$/i)).toHaveValue("");
    expect(screen.getByLabelText(/confirm password/i)).toHaveValue("");

    expect(onRegistered).toHaveBeenCalled();
  });

  test("backend error shows returned message", async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: "User already exists" })
    });

    renderWithProviders(<Register />);

    fillAndSubmit({ username: "dup", password: "p", confirm: "p" });

    expect(await screen.findByText(/User already exists/i)).toBeInTheDocument();
  });

  test("backend error without message falls back to default", async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      json: async () => ({}) // no message
    });

    renderWithProviders(<Register />);

    fillAndSubmit({ username: "x", password: "p", confirm: "p" });

    expect(await screen.findByText(/Registration failed\./i)).toBeInTheDocument();
  });

  test("network error shows error message", async () => {
    fetchSpy.mockRejectedValueOnce(new Error("Network down"));

    renderWithProviders(<Register />);

    fillAndSubmit({ username: "u", password: "p", confirm: "p" });

    expect(await screen.findByText(/Registration failed: Network down/i)).toBeInTheDocument();
  });

  test("Back to Login button triggers switchToLogin handler", () => {
    const switchToLogin = jest.fn();
    renderWithProviders(<Register switchToLogin={switchToLogin} />);

    fireEvent.click(screen.getByRole("button", { name: /Back to Login/i }));
    expect(switchToLogin).toHaveBeenCalled();
  });
});
