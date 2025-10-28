import React, { useState } from "react";
import "../css/components/AppCard.css";
import ThemeToggle from "./ThemeToggle";

const Register = ({ onRegistered, switchToLogin }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!username || !password) {
      setError("Username and password are required.");
      return;
    }
    if (password !== passwordConfirm) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const apiBase = process.env.REACT_APP_API_BASE_URL;
      const resp = await fetch(`${apiBase}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (resp.ok) {
        setSuccess(
          "Registration successful. Your account needs to be approved by an admin before login."
        );
        setUsername("");
        setPassword("");
        setPasswordConfirm("");
        if (onRegistered) onRegistered();
      } else {
        const data = await resp.json();
        setError(data.message || "Registration failed.");
      }
    } catch (err) {
      if (err && err.message) {
        setError("Registration failed: " + err.message);
      } else {
        setError("Registration failed due to network or server error.");
      }
    }
  };

  return (
    <div className="app-gradient-bg">
      <div className="app-card">
        <div className="app-card-actions">
          <ThemeToggle colorVar="--text-primary" />
        </div>
        <img src="/logo192.png" alt="Logo" className="app-card-logo" />
        <h2 className="app-card-title">Create Account</h2>
        <div className="app-card-subtitle">Join and start managing your todos</div>
        <form onSubmit={handleSubmit} className="app-form">
          <div>
            <label htmlFor="reg-username" className="app-label">
              Username
            </label>
            <input
              id="reg-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              type="text"
              required
              className="app-input"
              placeholder="Your username"
            />
          </div>
          <div>
            <label htmlFor="reg-password" className="app-label">
              Password
            </label>
            <input
              id="reg-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
              className="app-input"
              placeholder="Choose password"
            />
          </div>
          <div>
            <label htmlFor="reg-password-confirm" className="app-label">
              Confirm Password
            </label>
            <input
              id="reg-password-confirm"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              type="password"
              required
              className="app-input"
              placeholder="Repeat password"
            />
          </div>
          <button type="submit" className="app-button-primary">
            Register
          </button>
        </form>
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
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

export default Register;
