import '@testing-library/jest-dom';
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ForgotPassword from "../components/ForgotPassword";
import { ThemeProvider } from "../context/ThemeContext";

const renderWithTheme = (ui, options) => render(<ThemeProvider>{ui}</ThemeProvider>, options);

describe('unit', () => {
  describe("ForgotPassword", () => {
    beforeEach(() => {
      jest.clearAllMocks();
      global.fetch = jest.fn();
      jest.useFakeTimers();
    });
    afterEach(() => {
      jest.useRealTimers();
    });

it("renders form fields and back button", () => {
      renderWithTheme(<ForgotPassword />);
      expect(screen.getByText(/Forgot Password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Username/)).toBeInTheDocument();
      expect(screen.getByLabelText(/New Password/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Confirm Password/)).toBeInTheDocument();
      expect(screen.getByText(/Back to Login/i)).toBeInTheDocument();
      expect(screen.getByText(/Reset Password/i)).toBeInTheDocument();
    });

it("shows error when required fields missing", () => {
      renderWithTheme(<ForgotPassword />);
      fireEvent.click(screen.getByText(/Reset Password/i));
      expect(screen.getByText(/Username is required/i)).toBeInTheDocument();
    });

it("shows error if passwords do not match", () => {
      renderWithTheme(<ForgotPassword />);
      fireEvent.change(screen.getByLabelText(/Username/), { target: { value: "bob" }});
      fireEvent.change(screen.getByLabelText(/New Password/), { target: { value: "a" }});
      fireEvent.change(screen.getByLabelText(/Confirm Password/), { target: { value: "b" }});
      fireEvent.click(screen.getByText(/Reset Password/i));
      expect(screen.getByText(/Passwords do not match/i)).toBeInTheDocument();
    });

it("shows message after successful password reset and calls switchToLogin after delay", async () => {
      const switchToLogin = jest.fn();
      fetch.mockResolvedValueOnce({ ok: true });
      renderWithTheme(<ForgotPassword switchToLogin={switchToLogin} />);
      fireEvent.change(screen.getByLabelText(/Username/), { target: { value: "bob" }});
      fireEvent.change(screen.getByLabelText(/New Password/), { target: { value: "x" }});
      fireEvent.change(screen.getByLabelText(/Confirm Password/), { target: { value: "x" }});
      fireEvent.click(screen.getByText(/Reset Password/i));
      expect(await screen.findByText(/Password has been reset/i)).toBeInTheDocument();
      jest.runAllTimers();
      expect(switchToLogin).toHaveBeenCalled();
    });

it("shows error if server returns !ok", async () => {
      fetch.mockResolvedValueOnce({ ok: false });
      renderWithTheme(<ForgotPassword />);
      fireEvent.change(screen.getByLabelText(/Username/), { target: { value: "bob" }});
      fireEvent.change(screen.getByLabelText(/New Password/), { target: { value: "x" }});
      fireEvent.change(screen.getByLabelText(/Confirm Password/), { target: { value: "x" }});
      fireEvent.click(screen.getByText(/Reset Password/i));
      expect(await screen.findByText(/Password reset failed/i)).toBeInTheDocument();
    });

it("shows error on network/server failure", async () => {
      fetch.mockRejectedValueOnce("fail");
      renderWithTheme(<ForgotPassword />);
      fireEvent.change(screen.getByLabelText(/Username/), { target: { value: "bob" }});
      fireEvent.change(screen.getByLabelText(/New Password/), { target: { value: "x" }});
      fireEvent.change(screen.getByLabelText(/Confirm Password/), { target: { value: "x" }});
      fireEvent.click(screen.getByText(/Reset Password/i));
      expect(await screen.findByText(/Network or server error/i)).toBeInTheDocument();
    });

it("calls switchToLogin when Back to Login clicked", () => {
      const switchToLogin = jest.fn();
      renderWithTheme(<ForgotPassword switchToLogin={switchToLogin} />);
      fireEvent.click(screen.getByText(/Back to Login/i));
      expect(switchToLogin).toHaveBeenCalled();
    });
  });
});
