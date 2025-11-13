import React, { useState, useEffect } from "react";
import "../css/components/AppCard.css";
import ThemeToggle from "./ThemeToggle";

const ResetPassword = ({ tokenProp, onSuccess }) => {
  // Accept token as a prop or from query string
  const [token, setToken] = useState(tokenProp || "");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // On mount, if no tokenProp, parse from URL
  useEffect(() => {
    if (!token) {
      const params = new URLSearchParams(window.location.search);
      const tokenFromQS = params.get("token");
      if (tokenFromQS) setToken(tokenFromQS);
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!token || !password) {
      setError("All fields are required.");
      return;
    }
    if (password !== passwordConfirm) {
      setError("Passwords do not match.");
      return;
    }
    try {
      const apiBase = process.env.REACT_APP_API_BASE_URL;
      const resp = await fetch(`${apiBase}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });
      if (resp.ok) {
        setMessage("Password successfully reset. Please login with your new password.");
        setPassword("");
        setPasswordConfirm("");
        if (onSuccess) onSuccess();
      } else {
        setError("Password reset failed or token invalid.");
      }
    } catch {
      setError("Server or network error.");
    }
  };

  return (
    <div className="app-gradient-bg">
      <div className="container">
        <div className="app-card">
          <div className="app-card-actions">
            <ThemeToggle colorVar="--text-primary" />
          </div>
          <img src="/logo192.png" alt="Logo" className="app-card-logo" />
          <h2 className="app-card-title">Reset Password</h2>
          <div className="app-card-subtitle">Set a new password for your account</div>

          {!token && (
            <div className="alert alert-error">Invalid or missing token.</div>
          )}

          <form onSubmit={handleSubmit} className="app-form">
            <div>
              <label htmlFor="rp-password" className="app-label">
                New Password
              </label>
              <input
                id="rp-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={!token}
                className="app-input"
                placeholder="Type your new password"
              />
            </div>
            <div>
              <label htmlFor="rp-password-confirm" className="app-label">
                Confirm Password
              </label>
              <input
                id="rp-password-confirm"
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                required
                disabled={!token}
                className="app-input"
                placeholder="Repeat new password"
              />
            </div>
            <button type="submit" disabled={!token} className="app-button-primary">
              Reset Password
            </button>
          </form>

          {error && <div className="alert alert-error">{error}</div>}
          {message && <div className="alert alert-success">{message}</div>}

          <div className="app-links-container">
            <button
              type="button"
              onClick={onSuccess}
              className="app-button-secondary"
            >
              ← Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
