/**
 * Tests for pushService (frontend PushNotificationService singleton)
 * Covers: init, requestPermission, subscribe/unsubscribe, register/unregister backend,
 * utility urlB64ToUint8Array, and error paths.
 *
 * Note: We avoid jest.isolateModulesAsync (not available in this setup).
 * We use jest.resetModules() in beforeEach and require() the singleton after
 * stubbing the environment for each test to ensure a fresh instance.
 */

describe("pushService - feature support and init()", () => {
  const origNavigator = global.navigator;
  const origWindow = global.window;
  const origNotification = global.Notification;
  const origFetch = global.fetch;

  beforeEach(() => {
    jest.resetModules();
    // Provide base window and navigator with required minimal stubs
    global.window = { ...origWindow };
    global.navigator = { ...origNavigator };
    // Ensure atob exists for urlB64ToUint8Array
    global.atob = (b64) => Buffer.from(b64, "base64").toString("binary");
    // Silence logs in test output
    jest.spyOn(console, "warn").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
    // Default Notification mock with mutable permission
    global.Notification = {
      permission: "default",
      requestPermission: jest.fn().mockResolvedValue("granted")
    };
    // Default fetch mock
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    global.navigator = origNavigator;
    global.window = origWindow;
    global.Notification = origNotification;
    global.fetch = origFetch;
    delete global.atob;
  });

  function makeSupportedEnv() {
    // Minimal stubs to pass checkSupport()
    global.window.PushManager = function PushManager() {};
    // Service worker registration and push manager stubs
    const pushManager = {
      getSubscription: jest.fn().mockResolvedValue(null),
      subscribe: jest.fn().mockResolvedValue({
        endpoint: "https://example.com/ep",
        toJSON: () => ({ endpoint: "https://example.com/ep", keys: { p256dh: "k", auth: "a" } })
      })
    };
    const registration = {
      pushManager
    };
    const readyPromise = Promise.resolve(registration);
    global.navigator.serviceWorker = {
      register: jest.fn().mockResolvedValue(registration),
      ready: readyPromise
    };
    return { registration, pushManager };
  }

  test("isSupported=false when PushManager missing; init returns false and warns", async () => {
    // No PushManager -> unsupported
    delete global.window.PushManager;
    global.navigator.serviceWorker = undefined;

    const pushService = require("../../services/pushService").default;
    expect(pushService.isSupported).toBe(false);
    const ok = await pushService.init();
    expect(ok).toBe(false);
    expect(console.warn).toHaveBeenCalled();
  });

  test("init() succeeds, registers service worker and finds no existing subscription", async () => {
    const { registration, pushManager } = makeSupportedEnv();

    const pushService = require("../../services/pushService").default;
    expect(pushService.isSupported).toBe(true);
    const ok = await pushService.init();
    expect(ok).toBe(true);
    // registration set and getSubscription called
    expect(global.navigator.serviceWorker.register).toHaveBeenCalledWith("/sw.js", { scope: "/" });
    // pushManager getSubscription invoked
    expect(pushManager.getSubscription).toHaveBeenCalled();
    // internal registration stored
    expect(pushService.registration).toBe(registration);
  });

  test("requestPermission resolves on granted, throws on denied", async () => {
    makeSupportedEnv();
    const pushService = require("../../services/pushService").default;
    // granted path
    global.Notification.requestPermission.mockResolvedValueOnce("granted");
    await expect(pushService.requestPermission()).resolves.toBe("granted");
    // denied path
    global.Notification.requestPermission.mockResolvedValueOnce("denied");
    await expect(pushService.requestPermission()).rejects.toThrow("Notification permission denied");
  });

  test("subscribe throws if registration not initialized; then succeeds after init", async () => {
    const { pushManager } = makeSupportedEnv();
    const pushService = require("../../services/pushService").default;

    // subscribe before init
    await expect(pushService.subscribe("B64KEY")).rejects.toThrow("Service worker not initialized");

    // init and then subscribe
    await pushService.init();
    const sub = await pushService.subscribe("B64KEY");
    expect(sub).toBeDefined();
    expect(pushManager.subscribe).toHaveBeenCalledWith(
      expect.objectContaining({ userVisibleOnly: true, applicationServerKey: expect.any(Uint8Array) })
    );
    // subscription stored
    expect(pushService.subscription).toBe(sub);
  });

  test("unsubscribe returns true when no subscription, then unsubscribes when present", async () => {
    makeSupportedEnv();
    const pushService = require("../../services/pushService").default;
    await pushService.init();
    // no subscription yet -> true
    expect(await pushService.unsubscribe()).toBe(true);

    // set a fake subscription and ensure unsubscribe called
    const fakeSub = {
      unsubscribe: jest.fn().mockResolvedValue(true),
      toJSON: () => ({ endpoint: "https://x" }),
      endpoint: "https://x"
    };
    pushService.subscription = fakeSub;
    const res = await pushService.unsubscribe();
    expect(res).toBe(true);
    expect(fakeSub.unsubscribe).toHaveBeenCalled();
    expect(pushService.subscription).toBe(null);
  });

  test("registerWithBackend posts subscription JSON; throws on non-ok", async () => {
    makeSupportedEnv();
    const pushService = require("../../services/pushService").default;
    await pushService.init();
    // Set a subscription
    const sub = {
      endpoint: "https://ok",
      toJSON: () => ({ endpoint: "https://ok", keys: { p256dh: "p", auth: "a" } })
    };
    pushService.subscription = sub;

    // ok response
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: "ok" })
    });
    const ok = await pushService.registerWithBackend();
    expect(ok).toEqual({ status: "ok" });
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/push/subscribe",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "Content-Type": "application/json" })
      })
    );

    // non-ok error with json body
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "bad" })
    });
    await expect(pushService.registerWithBackend()).rejects.toThrow("bad");
  });

  test("unregisterFromBackend posts endpoint; tolerates non-ok", async () => {
    makeSupportedEnv();
    const pushService = require("../../services/pushService").default;
    await pushService.init();
    const sub = { endpoint: "https://gone", toJSON: () => ({ endpoint: "https://gone" }) };
    pushService.subscription = sub;

    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    await expect(pushService.unregisterFromBackend()).resolves.toBeUndefined();
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/push/unsubscribe",
      expect.objectContaining({ method: "POST" })
    );

    // Non-ok should not throw
    global.fetch.mockResolvedValueOnce({ ok: false, json: async () => ({ error: "nope" }) });
    await expect(pushService.unregisterFromBackend()).resolves.toBeUndefined();
  });

  test("urlB64ToUint8Array converts base64url -> Uint8Array", async () => {
    makeSupportedEnv();
    const pushService = require("../../services/pushService").default;
    const base64url = "SGVsbG8td29ybGQ_"; // "Hello-world?" in base64url
    const arr = pushService.urlB64ToUint8Array(base64url);
    expect(arr).toBeInstanceOf(Uint8Array);
    expect(arr.length).toBeGreaterThan(0);
  });
});
