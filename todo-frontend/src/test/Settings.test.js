import "@testing-library/jest-dom";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Settings from "../components/Settings";
import AuthContext from "../context/AuthContext";

// Mock the push notifications hook to control all states/handlers
jest.mock("../hooks/usePushNotifications", () => ({
  __esModule: true,
  default: jest.fn()
}));

const mockUsePushNotifications = require("../hooks/usePushNotifications").default;

const renderWithProviders = (ui, { user = { status: "ACTIVE" } } = {}) => {
  return render(
    <MemoryRouter>
      <AuthContext.Provider value={{ user }}>
        {ui}
      </AuthContext.Provider>
    </MemoryRouter>
  );
};

describe("Settings Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("shows pending approval message when user.status is PENDING", () => {
    mockUsePushNotifications.mockReturnValue({
      isSupported: true,
      isSubscribed: false,
      permission: "default",
      isLoading: false,
      error: null,
      enableNotifications: jest.fn(),
      disableNotifications: jest.fn()
    });

    renderWithProviders(<Settings />, { user: { status: "PENDING" } });

    expect(screen.getByText(/Account Pending Approval/i)).toBeInTheDocument();
    expect(screen.getByText(/pending approval by an admin/i)).toBeInTheDocument();
  });

  test("renders Not Supported alert when push is not supported", () => {
    mockUsePushNotifications.mockReturnValue({
      isSupported: false,
      isSubscribed: false,
      permission: "default",
      isLoading: false,
      error: null,
      enableNotifications: jest.fn(),
      disableNotifications: jest.fn()
    });

    renderWithProviders(<Settings />);

    expect(screen.getByText(/Not Supported:/i)).toBeInTheDocument();
    expect(screen.getByText(/Push notifications are not supported/i)).toBeInTheDocument();
  });

  test("Enable Notifications flow: calls enableNotifications and shows success alert", async () => {
    const enableSpy = jest.fn().mockResolvedValue(undefined);
    mockUsePushNotifications.mockReturnValue({
      isSupported: true,
      isSubscribed: false,
      permission: "default",
      isLoading: false,
      error: null,
      enableNotifications: enableSpy,
      disableNotifications: jest.fn()
    });

    renderWithProviders(<Settings />);

    const btn = screen.getByRole("button", { name: /Enable Notifications/i });
    fireEvent.click(btn);

    expect(enableSpy).toHaveBeenCalled();

    // Success message is set inside Settings after await
    expect(await screen.findByText(/Push notifications enabled successfully!/i)).toBeInTheDocument();
  });

  test("Disable Notifications flow: calls disableNotifications and shows success alert", async () => {
    const disableSpy = jest.fn().mockResolvedValue(undefined);
    mockUsePushNotifications.mockReturnValue({
      isSupported: true,
      isSubscribed: true,
      permission: "granted",
      isLoading: false,
      error: null,
      enableNotifications: jest.fn(),
      disableNotifications: disableSpy
    });

    renderWithProviders(<Settings />);

    const btn = screen.getByRole("button", { name: /Disable Notifications/i });
    fireEvent.click(btn);

    expect(disableSpy).toHaveBeenCalled();
    expect(await screen.findByText(/Push notifications disabled successfully!/i)).toBeInTheDocument();
  });

  test("Permission denied: enable button disabled and info alert shown", () => {
    mockUsePushNotifications.mockReturnValue({
      isSupported: true,
      isSubscribed: false,
      permission: "denied",
      isLoading: false,
      error: null,
      enableNotifications: jest.fn(),
      disableNotifications: jest.fn()
    });

    renderWithProviders(<Settings />);

    expect(screen.getByText(/Permission Denied:/i)).toBeInTheDocument();
    const enableBtn = screen.getByRole("button", { name: /Enable Notifications/i });
    expect(enableBtn).toBeDisabled();
  });

  test("Loading states: button text changes and disabled while loading when unsubscribed", () => {
    mockUsePushNotifications.mockReturnValue({
      isSupported: true,
      isSubscribed: false,
      permission: "default",
      isLoading: true,
      error: null,
      enableNotifications: jest.fn(),
      disableNotifications: jest.fn()
    });

    renderWithProviders(<Settings />);
    const enableBtn = screen.getByRole("button", { name: /Enabling.../i });
    expect(enableBtn).toBeDisabled();
  });

  test("Loading states: button text changes and disabled while loading when subscribed", () => {
    mockUsePushNotifications.mockReturnValue({
      isSupported: true,
      isSubscribed: true,
      permission: "granted",
      isLoading: true,
      error: null,
      enableNotifications: jest.fn(),
      disableNotifications: jest.fn()
    });

    renderWithProviders(<Settings />);
    const disableBtn = screen.getByRole("button", { name: /Disabling.../i });
    expect(disableBtn).toBeDisabled();
  });

  test("Displays error alert when hook returns error", () => {
    mockUsePushNotifications.mockReturnValue({
      isSupported: true,
      isSubscribed: false,
      permission: "default",
      isLoading: false,
      error: "Something went wrong",
      enableNotifications: jest.fn(),
      disableNotifications: jest.fn()
    });

    renderWithProviders(<Settings />);

    expect(screen.getByText(/Error:/i)).toBeInTheDocument();
    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
  });

  test("Shows current status and permission labels", () => {
    mockUsePushNotifications.mockReturnValue({
      isSupported: true,
      isSubscribed: false,
      permission: "default",
      isLoading: false,
      error: null,
      enableNotifications: jest.fn(),
      disableNotifications: jest.fn()
    });

    renderWithProviders(<Settings />);

    expect(screen.getByText(/Status:/i)).toBeInTheDocument();
    expect(screen.getByText(/Disabled/i)).toBeInTheDocument();
    expect(screen.getByText(/Permission:/i)).toBeInTheDocument();
    expect(screen.getByText(/Not requested/i)).toBeInTheDocument();
  });
});
