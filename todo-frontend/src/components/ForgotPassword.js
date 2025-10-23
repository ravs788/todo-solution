import React, { useState } from "react";
import "../css/components/AppCard.css";
import ThemeToggle from "./ThemeToggle";

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
    <div className="app-gradient-bg">
      <div className="app-card">
        <div className="app-card-actions">
          <ThemeToggle colorVar="--text-primary" />
        </div>
        <img src="/logo192.png" alt="Logo" className="app-card-logo" />
        <h2 className="app-card-title">Forgot Password</h2>
        <div className="app-card-subtitle">Reset your account password</div>

        <form onSubmit={handleSubmit} className="app-form">
          <div>
            <label htmlFor="fp-username" className="app-label">
              Username
            </label>
            <input
              id="fp-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              type="text"
              required
              className="app-input"
              placeholder="Enter your username"
            />
          </div>
          <div>
            <label htmlFor="fp-password" className="app-label">
              New Password
            </label>
            <input
              id="fp-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
              className="app-input"
              placeholder="Type your new password"
            />
          </div>
          <div>
            <label htmlFor="fp-password-confirm" className="app-label">
              Confirm Password
            </label>
            <input
              id="fp-password-confirm"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              type="password"
              required
              className="app-input"
              placeholder="Repeat new password"
            />
          </div>
          <button type="submit" className="app-button-primary">
            Reset Password
          </button>
        </form>

        {error && <div className="alert alert-error">{error}</div>}
        {message && <div className="alert alert-success">{message}</div>}

        <div className="app-links-container">
          <button
            type="button"
            onClick={switchToLogin}
            className="app-button-secondary"
          >
            ← Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
