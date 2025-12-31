import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import usePushNotifications from "../usePushNotifications";

// Mock the singleton pushService
jest.mock("../../services/pushService", () => ({
  __esModule: true,
  default: {
    isSupported: true,
    init: jest.fn(),
    isSubscribed: jest.fn(),
    getPermissionStatus: jest.fn(),
    requestPermission: jest.fn(),
    getVapidPublicKey: jest.fn(),
    subscribe: jest.fn(),
    registerWithBackend: jest.fn(),
    unregisterFromBackend: jest.fn(),
    unsubscribe: jest.fn(),
    getSubscription: jest.fn()
  }
}));

const pushService = require("../../services/pushService").default;

// Test harness component that exposes hook state and actions via UI
function Harness() {
  const {
    isSupported,
    isSubscribed,
    permission,
    isLoading,
    error,
    enableNotifications,
    disableNotifications,
    checkStatus
  } = usePushNotifications();

  return (
    <div>
      <div data-testid="supported">{String(isSupported)}</div>
      <div data-testid="subscribed">{String(isSubscribed)}</div>
      <div data-testid="permission">{permission}</div>
      <div data-testid="loading">{String(isLoading)}</div>
      <div data-testid="error">{error || ""}</div>
      <button onClick={() => { Promise.resolve(enableNotifications()).catch(() => {}); }}>enable</button>
      <button onClick={() => { Promise.resolve(disableNotifications()).catch(() => {}); }}>disable</button>
      <button onClick={checkStatus}>check</button>
    </div>
  );
}

describe("usePushNotifications", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // default supported
    pushService.isSupported = true;
  });

  test("initializes: unsupported environment sets isSupported=false and skips init", async () => {
    pushService.isSupported = false;

    render(<Harness />);

    expect(screen.getByTestId("supported").textContent).toBe("false");
    // error should be empty, no loading
    expect(screen.getByTestId("error").textContent).toBe("");
    expect(screen.getByTestId("loading").textContent).toBe("false");
    // pushService.init should not be called when unsupported
    expect(pushService.init).not.toHaveBeenCalled();
  });

  test("initializes: supported environment calls init, sets subscription and permission", async () => {
    pushService.init.mockResolvedValue(true);
    pushService.isSubscribed.mockReturnValue(false);
    pushService.getPermissionStatus.mockReturnValue("default");

    render(<Harness />);

    await waitFor(() => {
      expect(pushService.init).toHaveBeenCalled();
    });

    expect(screen.getByTestId("supported").textContent).toBe("true");
    expect(screen.getByTestId("subscribed").textContent).toBe("false");
    expect(screen.getByTestId("permission").textContent).toBe("default");
    expect(screen.getByTestId("error").textContent).toBe("");
  });

  test("enableNotifications: requests permission, subscribes and registers backend", async () => {
    pushService.init.mockResolvedValue(true);
    pushService.isSubscribed.mockReturnValue(false);
    pushService.getPermissionStatus.mockReturnValue("default");
    pushService.requestPermission.mockResolvedValue("granted");
    pushService.getVapidPublicKey.mockResolvedValue("VAPID_KEY");
    pushService.subscribe.mockResolvedValue({ endpoint: "ep" });
    pushService.registerWithBackend.mockResolvedValue({ ok: true });

    render(<Harness />);

    // wait for init
    await waitFor(() => expect(pushService.init).toHaveBeenCalled());

    // click enable
    fireEvent.click(screen.getByText("enable"));

    // isLoading should become true then false, and subscribed true
    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("false");
      expect(screen.getByTestId("subscribed").textContent).toBe("true");
      expect(screen.getByTestId("permission").textContent).toBe("granted");
    });

    expect(pushService.requestPermission).toHaveBeenCalled();
    expect(pushService.getVapidPublicKey).toHaveBeenCalled();
    expect(pushService.subscribe).toHaveBeenCalled();
    expect(pushService.registerWithBackend).toHaveBeenCalled();
  });

  test("enableNotifications: propagates error and sets error state", async () => {
    pushService.init.mockResolvedValue(true);
    pushService.isSubscribed.mockReturnValue(false);
    pushService.getPermissionStatus.mockReturnValue("default");
    pushService.requestPermission.mockRejectedValue(new Error("deny"));

    render(<Harness />);
    await waitFor(() => expect(pushService.init).toHaveBeenCalled());

    fireEvent.click(screen.getByText("enable"));

    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("false");
      expect(screen.getByTestId("error").textContent).toBe("deny");
    });
  });

  test("disableNotifications: unregisters backend and unsubscribes, then sets subscribed=false", async () => {
    pushService.init.mockResolvedValue(true);
    pushService.isSubscribed.mockReturnValue(true);
    pushService.getPermissionStatus.mockReturnValue("granted");
    pushService.unregisterFromBackend.mockResolvedValue(undefined);
    pushService.unsubscribe.mockResolvedValue(true);

    render(<Harness />);
    await waitFor(() => expect(pushService.init).toHaveBeenCalled());

    fireEvent.click(screen.getByText("disable"));

    await waitFor(() => {
      expect(pushService.unregisterFromBackend).toHaveBeenCalled();
      expect(pushService.unsubscribe).toHaveBeenCalled();
      expect(screen.getByTestId("subscribed").textContent).toBe("false");
    });
  });

  test("checkStatus: reads subscription and permission from service", async () => {
    pushService.init.mockResolvedValue(true);
    pushService.isSubscribed.mockReturnValue(false);
    pushService.getPermissionStatus.mockReturnValue("default");

    render(<Harness />);
    await waitFor(() => expect(pushService.init).toHaveBeenCalled());

    pushService.getSubscription.mockReturnValue({ endpoint: "x" });
    pushService.getPermissionStatus.mockReturnValue("granted");

    fireEvent.click(screen.getByText("check"));

    await waitFor(() => {
      expect(screen.getByTestId("subscribed").textContent).toBe("true");
      expect(screen.getByTestId("permission").textContent).toBe("granted");
    });
  });
});
