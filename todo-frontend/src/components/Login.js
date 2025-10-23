import React, { useState, useContext } from "react";
import AuthContext from "../context/AuthContext";
import { useEffect } from "react";
import "../css/components/AppCard.css";
import ThemeToggle from "./ThemeToggle";

const Login = ({ message, onLogin, switchToRegister, switchToForgot, onRender }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login: authContextLogin } = useContext(AuthContext);

  // Autosizing input (kept dynamic width inline; all other styles moved to CSS)
  const getInputWidth = (value) => {
    let len = Math.min(Math.max(value.length || 1, 50), 100);
    return `${len + 1}ch`;
  };

  useEffect(() => {
    if (typeof onRender === "function") {
      onRender();
    }
  }, [onRender]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const apiBase = process.env.REACT_APP_API_BASE_URL;
      const response = await fetch(`${apiBase}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        setError("Invalid username or password");
        return;
      }

      const token = await response.text();
      localStorage.setItem("jwtToken", token);
      if (typeof authContextLogin === "function") {
        authContextLogin(token);
      }
      if (typeof onLogin === "function") onLogin(token);
    } catch (err) {
      setError("Login failed");
    }
  };

  return (
    <div className="app-gradient-bg">
      <div className="app-card">
        <div className="app-card-actions">
          <ThemeToggle colorVar="--text-primary" />
        </div>
        <img src="/logo192.png" alt="Logo" className="app-card-logo" />
        <h2 className="app-card-title">Welcome Back!</h2>
        <div className="app-card-subtitle">Sign in to your account</div>
        <form onSubmit={handleSubmit} className="app-form">
          <div>
            <label htmlFor="login-username" className="app-label">
              Username
            </label>
            <input
              id="login-username"
              type="text"
              value={username}
              autoFocus
              maxLength={100}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{ width: getInputWidth(username) }}
              className="app-input"
              placeholder="e.g. johndoe"
            />
          </div>
          <div>
            <label htmlFor="login-password" className="app-label">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              value={password}
              maxLength={100}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: getInputWidth(password) }}
              className="app-input"
              placeholder="Enter your password"
            />
          </div>
          <button type="submit" className="app-button-primary">
            Login
          </button>
        </form>

        {message && (
          <div className="app-message-container">
            <span className="app-message" tabIndex={-1}>
              {message}
            </span>
          </div>
        )}

        {error && <div className="alert alert-error">{error}</div>}

        <div className="app-links-container">
          <button type="button" onClick={switchToRegister} className="text-link-button">
            Need an account? <span className="text-underline">Register</span> here
          </button>
          <button type="button" onClick={switchToForgot} className="text-link-button">
            Forgot password?
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
