import "@testing-library/jest-dom";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ReminderToast from "../components/ReminderToast";

// Mock ToastContext to control removeToast without needing a Provider
const mockRemoveToast = jest.fn();
jest.mock("../context/ToastContext", () => ({
  useToast: () => ({
    removeToast: mockRemoveToast
  })
}));

describe("ReminderToast Component", () => {
  const OLD_ENV = process.env;
  let fetchSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...OLD_ENV, REACT_APP_API_BASE_URL: "http://api.example.com" };
    fetchSpy = jest.spyOn(global, "fetch").mockResolvedValue({ ok: true });
    localStorage.clear();
  });

  afterEach(() => {
    process.env = OLD_ENV;
    if (fetchSpy) fetchSpy.mockRestore();
  });

  test("does not render for non-reminder toast", () => {
    render(
      <ReminderToast
        toast={{
          id: "t1",
          type: "info",
          title: "Info",
          message: "Not a reminder"
        }}
      />
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  test("Snooze 10m triggers PUT with reminderAt and calls removeToast", async () => {
    localStorage.setItem("jwtToken", "TOKEN");
    const toast = {
      id: "r1",
      type: "reminder",
      title: "Reminder Title",
      message: "Reminder message",
      todo: { id: "42" }
    };

    render(<ReminderToast toast={toast} />);

    fireEvent.click(screen.getByRole("button", { name: /Snooze 10m/i }));

    await waitFor(() => expect(fetchSpy).toHaveBeenCalled());

    expect(fetchSpy).toHaveBeenCalledWith(
      "http://api.example.com/api/todos/42",
      expect.objectContaining({
        method: "PUT",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          Authorization: "Bearer TOKEN"
        }),
        body: expect.any(String)
      })
    );

    const [, options] = fetchSpy.mock.calls[0];
    const payload = JSON.parse(options.body);
    expect(payload).toHaveProperty("reminderAt");
    expect(isNaN(Date.parse(payload.reminderAt))).toBe(false);

    await waitFor(() => expect(mockRemoveToast).toHaveBeenCalledWith("r1"));
  });

  test("Mark Done triggers PUT completed=true and calls removeToast", async () => {
    localStorage.setItem("jwtToken", "TOKEN");
    const toast = {
      id: "r2",
      type: "reminder",
      title: "Reminder Title",
      message: "Reminder message",
      todo: { id: "7" }
    };

    render(<ReminderToast toast={toast} />);

    fireEvent.click(screen.getByRole("button", { name: /Mark Done/i }));

    await waitFor(() => expect(fetchSpy).toHaveBeenCalled());

    expect(fetchSpy).toHaveBeenCalledWith(
      "http://api.example.com/api/todos/7",
      expect.objectContaining({
        method: "PUT",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          Authorization: "Bearer TOKEN"
        }),
        body: expect.any(String)
      })
    );

    const [, options] = fetchSpy.mock.calls[0];
    const payload = JSON.parse(options.body);
    expect(payload).toEqual(expect.objectContaining({ completed: true }));

    await waitFor(() => expect(mockRemoveToast).toHaveBeenCalledWith("r2"));
  });

  test("Dismiss calls removeToast without network call", () => {
    const toast = {
      id: "r3",
      type: "reminder",
      title: "Reminder Title",
      message: "Reminder message",
      todo: { id: "10" }
    };

    render(<ReminderToast toast={toast} />);

    fireEvent.click(screen.getByRole("button", { name: /Dismiss/i }));

    expect(mockRemoveToast).toHaveBeenCalledWith("r3");
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
