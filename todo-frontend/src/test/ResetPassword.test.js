import "@testing-library/jest-dom";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ResetPassword from "../components/ResetPassword";
import { ThemeProvider } from "../context/ThemeContext";

describe("ResetPassword Component", () => {
  const OLD_ENV = process.env;
  let fetchSpy;

  const renderWithProviders = (ui) => render(<ThemeProvider>{ui}</ThemeProvider>);

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...OLD_ENV, REACT_APP_API_BASE_URL: "http://api.example.com" };
    fetchSpy = jest.spyOn(global, "fetch").mockResolvedValue({ ok: true });
  });

  afterEach(() => {
    process.env = OLD_ENV;
    if (fetchSpy) fetchSpy.mockRestore();
  });

  test("shows invalid token message and disables inputs when token is missing", () => {
    // No tokenProp and no query string token
    const origLocation = window.location;
    delete window.location;
    window.location = { search: "" };

    renderWithProviders(<ResetPassword onSuccess={jest.fn()} />);

    expect(screen.getByText(/Invalid or missing token\./i)).toBeInTheDocument();
    expect(screen.getByLabelText(/New Password/i)).toBeDisabled();
    expect(screen.getByLabelText(/Confirm Password/i)).toBeDisabled();
    expect(screen.getByRole("button", { name: /Reset Password/i })).toBeDisabled();

    // restore location
    window.location = origLocation;
  });

  test("validation error when password missing", () => {
    renderWithProviders(<ResetPassword tokenProp="TOK" />);

    // Don't type any password, just submit
    fireEvent.click(screen.getByRole("button", { name: /Reset Password/i }));

    expect(screen.getByText(/All fields are required\./i)).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  test("validation error when passwords do not match", () => {
    renderWithProviders(<ResetPassword tokenProp="TOK" />);

    fireEvent.change(screen.getByLabelText(/New Password/i), { target: { value: "p1" } });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: "p2" } });
    fireEvent.click(screen.getByRole("button", { name: /Reset Password/i }));

    expect(screen.getByText(/Passwords do not match\./i)).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  test("successful reset shows success, clears fields, and calls onSuccess", async () => {
    const onSuccess = jest.fn();
    fetchSpy.mockResolvedValueOnce({ ok: true });

    renderWithProviders(<ResetPassword tokenProp="TOK" onSuccess={onSuccess} />);

    fireEvent.change(screen.getByLabelText(/New Password/i), { target: { value: "secret" } });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: "secret" } });
    fireEvent.click(screen.getByRole("button", { name: /Reset Password/i }));

    expect(fetchSpy).toHaveBeenCalledWith(
      "http://api.example.com/api/auth/reset-password",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: "TOK", newPassword: "secret" })
      })
    );

    expect(
      await screen.findByText(/Password successfully reset\. Please login with your new password\./i)
    ).toBeInTheDocument();

    expect(screen.getByLabelText(/New Password/i)).toHaveValue("");
    expect(screen.getByLabelText(/Confirm Password/i)).toHaveValue("");

    expect(onSuccess).toHaveBeenCalled();
  });

  test("backend failure shows error message", async () => {
    fetchSpy.mockResolvedValueOnce({ ok: false });

    renderWithProviders(<ResetPassword tokenProp="TOK" />);

    fireEvent.change(screen.getByLabelText(/New Password/i), { target: { value: "secret" } });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: "secret" } });
    fireEvent.click(screen.getByRole("button", { name: /Reset Password/i }));

    expect(await screen.findByText(/Password reset failed or token invalid\./i)).toBeInTheDocument();
  });

  test("network error shows server error message", async () => {
    fetchSpy.mockRejectedValueOnce(new Error("down"));

    renderWithProviders(<ResetPassword tokenProp="TOK" />);

    fireEvent.change(screen.getByLabelText(/New Password/i), { target: { value: "secret" } });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: "secret" } });
    fireEvent.click(screen.getByRole("button", { name: /Reset Password/i }));

    expect(await screen.findByText(/Server or network error\./i)).toBeInTheDocument();
  });

  test("Back to Login button triggers onSuccess", () => {
    const onSuccess = jest.fn();
    renderWithProviders(<ResetPassword tokenProp="TOK" onSuccess={onSuccess} />);

    fireEvent.click(screen.getByRole("button", { name: /Back to Login/i }));
    expect(onSuccess).toHaveBeenCalled();
  });
});
