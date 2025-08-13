import React, { useState } from "react";

const ForgotPassword = ({ switchToLogin }) => {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!username) {
      setError("Username is required.");
      return;
    }
    if (!password) {
      setError("New password is required.");
      return;
    }
    if (password !== passwordConfirm) {
      setError("Passwords do not match.");
      return;
    }
    try {
      const apiBase = process.env.REACT_APP_API_BASE_URL;
      const resp = await fetch(`${apiBase}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, newPassword: password }),
      });
      if (resp.ok) {
        setMessage("Password has been reset. You may now log in.");
        setUsername("");
        setPassword("");
        setPasswordConfirm("");
        setTimeout(() => {
          if (typeof switchToLogin === "function") switchToLogin();
        }, 1500);
      } else {
        setError("Password reset failed. Please try again.");
      }
    } catch {
      setError("Network or server error.");
    }
  };

  return (
    <div style={{ marginTop: "2rem" }}>
      <h2>Forgot Password</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="fp-username">Username: </label>
          <input
            id="fp-username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            type="text"
            required
          />
        </div>
        <div>
          <label htmlFor="fp-password">New Password: </label>
          <input
            id="fp-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
          />
        </div>
        <div>
          <label htmlFor="fp-password-confirm">Confirm Password: </label>
          <input
            id="fp-password-confirm"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            type="password"
            required
          />
        </div>
        <button type="submit">Reset Password</button>
      </form>
      <div style={{ marginTop: "2.1rem", display: "flex", flexDirection: "column", width: "100%" }}>
        <button
          type="button"
          onClick={switchToLogin}
          style={{
            background: "#f3f6fb",
            color: "#1849a9",
            border: "1.5px solid #bcd5ee",
            fontWeight: 600,
            fontSize: "1.03rem",
            borderRadius: "7px",
            padding: "10px",
            width: "100%",
            cursor: "pointer",
            boxShadow: "0 1px 8px 0 #e2edf7"
          }}
        >
          ← Back to Login
        </button>
      </div>
      {error && <div style={{ color: "red", marginTop: "1rem" }}>{error}</div>}
      {message && (
        <div style={{ color: "green", marginTop: "1rem" }}>{message}</div>
      )}
    </div>
  );
};

export default ForgotPassword;
