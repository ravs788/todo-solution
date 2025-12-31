import React, { useContext } from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import AuthContext, { AuthProvider } from "../AuthContext";

// Helper to create a JWT with given payload (header/signature are dummies)
function b64url(json) {
  const base64 = Buffer.from(JSON.stringify(json)).toString("base64");
  return base64.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}
function makeToken(payload) {
  const header = { alg: "none", typ: "JWT" };
  return `${b64url(header)}.${b64url(payload)}.signature`;
}

function Consumer() {
  const { user, login, logout } = useContext(AuthContext);
  return (
    <div>
      <div data-testid="user">
        {user ? `${user.username}|${user.role}|${user.status}` : "null"}
      </div>
      <button onClick={() => login("VALID_TOKEN")} data-testid="login-valid">
        login-valid
      </button>
      <button onClick={() => login("INVALID")} data-testid="login-invalid">
        login-invalid
      </button>
      <button onClick={logout} data-testid="logout">
        logout
      </button>
    </div>
  );
}

describe("AuthContext branch coverage", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    // Always provide a robust base64url decoder to exercise parseJwt happy-path
    // Converts base64url (-,_) to base64 (+,/), adds required padding, then decodes.
    global.atob = (str) => {
      const b64 = str.replace(/-/g, "+").replace(/_/g, "/");
      const padLen = b64.length % 4 === 0 ? 0 : 4 - (b64.length % 4);
      const padded = b64 + "=".repeat(padLen);
      return Buffer.from(padded, "base64").toString("binary");
    };
  });

  test("initializes user from valid token in localStorage (useEffect branch)", async () => {
    const token = makeToken({
      sub: "alice",
      role: "ADMIN",
      status: "PENDING",
    });
    localStorage.setItem("jwtToken", token);

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    );

    // Effect runs post render
    await waitFor(() =>
      expect(screen.getByTestId("user").textContent).toBe("alice|ADMIN|PENDING")
    );
  });

  test("does not set user when localStorage token is invalid (parseJwt returns null)", async () => {
    localStorage.setItem("jwtToken", "malformed.token.value");

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    );

    // user remains null
    await waitFor(() =>
      expect(screen.getByTestId("user").textContent).toBe("null")
    );
  });

  test("login with valid token sets user and stores token", async () => {
    const payload = { sub: "bob", role: "USER", status: "ACTIVE" };
    const valid = makeToken(payload);

    // Intercept Consumer's login-valid to pass our valid token
    render(
      <AuthProvider>
        <AuthContext.Consumer>
          {({ login }) => (
            <>
              <Consumer />
              <button
                data-testid="trigger-login"
                onClick={() => login(valid)}
              />
            </>
          )}
        </AuthContext.Consumer>
      </AuthProvider>
    );

    fireEvent.click(screen.getByTestId("trigger-login"));

    await waitFor(() =>
      expect(screen.getByTestId("user").textContent).toBe("bob|USER|ACTIVE")
    );
    expect(localStorage.getItem("jwtToken")).toBe(valid);
  });

  test("login with invalid token results in user = null", async () => {
    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    );

    fireEvent.click(screen.getByTestId("login-invalid"));

    await waitFor(() =>
      expect(screen.getByTestId("user").textContent).toBe("null")
    );
  });

  test("logout clears tokens and sets user to null", async () => {
    const token = makeToken({ sub: "carol", role: "USER", status: "ACTIVE" });
    localStorage.setItem("jwtToken", token);
    sessionStorage.setItem("undoRedoHistory", "some-state");

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    );

    // First ensure effect sets user from token
    await waitFor(() =>
      expect(screen.getByTestId("user").textContent).toBe("carol|USER|ACTIVE")
    );

    fireEvent.click(screen.getByTestId("logout"));

    await waitFor(() =>
      expect(screen.getByTestId("user").textContent).toBe("null")
    );
    expect(localStorage.getItem("jwtToken")).toBeNull();
    expect(sessionStorage.getItem("undoRedoHistory")).toBeNull();
  });

  test("initializes defaults when localStorage token lacks role/status (useEffect path)", async () => {
    const token = makeToken({
      sub: "dave"
      // role/status omitted to cover || fallback branches
    });
    localStorage.setItem("jwtToken", token);

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    );

    await waitFor(() =>
      expect(screen.getByTestId("user").textContent).toBe("dave|USER|ACTIVE")
    );
  });

  test("login uses defaults when token payload lacks role/status (fallback branches)", async () => {
    const token = makeToken({
      sub: "eve"
      // role/status omitted to hit right-hand side of ||
    });

    render(
      <AuthProvider>
        <AuthContext.Consumer>
          {({ login }) => (
            <>
              <Consumer />
              <button
                data-testid="trigger-login-missing-fields"
                onClick={() => login(token)}
              />
            </>
          )}
        </AuthContext.Consumer>
      </AuthProvider>
    );

    // Trigger login with missing role/status to exercise fallbacks
    fireEvent.click(screen.getByTestId("trigger-login-missing-fields"));

    await waitFor(() =>
      expect(screen.getByTestId("user").textContent).toBe("eve|USER|ACTIVE")
    );
  });

  test("does not set user when token payload lacks sub (useEffect path)", async () => {
    const token = makeToken({
      // deliberately missing sub
      role: "USER",
      status: "ACTIVE",
    });
    localStorage.setItem("jwtToken", token);

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    );

    await waitFor(() =>
      expect(screen.getByTestId("user").textContent).toBe("null")
    );
  });

  test("login with token missing sub results in user = null", async () => {
    const token = makeToken({
      // deliberately missing sub
      role: "ADMIN",
      status: "PENDING",
    });

    render(
      <AuthProvider>
        <AuthContext.Consumer>
          {({ login }) => (
            <>
              <Consumer />
              <button
                data-testid="trigger-login-nosub"
                onClick={() => login(token)}
              />
            </>
          )}
        </AuthContext.Consumer>
      </AuthProvider>
    );

    fireEvent.click(screen.getByTestId("trigger-login-nosub"));

    await waitFor(() =>
      expect(screen.getByTestId("user").textContent).toBe("null")
    );
  });

  test("no token in localStorage leaves user null (if(token) false path)", async () => {
    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    );

    await waitFor(() =>
      expect(screen.getByTestId("user").textContent).toBe("null")
    );
  });
});
