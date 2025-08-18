import React, { useState, useContext } from "react";
import AuthContext from "../context/AuthContext";

import { useEffect } from "react";

const Login = ({ message, onLogin, switchToRegister, switchToForgot, onRender }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login: authContextLogin } = useContext(AuthContext);

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
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(120deg, #e0e7ff 0%, #d0fcfa 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "18px",
          boxShadow: "0 6px 36px 0 rgba(38,80,160,0.16)",
          maxWidth: "375px",
          width: "98%",
          padding: "38px 24px 32px 24px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center"
        }}
      >
        <div style={{ marginBottom: "16px" }}>
          <img
            src="/logo192.png"
            alt="Logo"
            style={{ width: "54px", borderRadius: "13px", boxShadow: "0 1px 6px 0 #ddd" }}
          />
        </div>
        <h2 style={{ fontWeight: 700, margin: 0, color: "#1b3877", fontSize: "2rem", letterSpacing: "0.02em" }}>Welcome Back!</h2>
        <div style={{ marginBottom: "18px", color: "#4c68a6" }}>Sign in to your account</div>
        <form
          onSubmit={handleSubmit}
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: "1.23rem"
          }}
        >
          <div>
            <label htmlFor="login-username" style={{ fontWeight: 500, color: "#1849a9" }}>
              Username
            </label>
            <input
              id="login-username"
              type="text"
              value={username}
              autoFocus
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{
                borderRadius: "7px",
                border: "1.2px solid #a4cbfd",
                padding: "10px",
                fontSize: "1.03rem",
                marginTop: "3px",
                width: "100%",
                background: "#f8fbff",
              }}
              placeholder="e.g. johndoe"
            />
          </div>
          <div>
            <label htmlFor="login-password" style={{ fontWeight: 500, color: "#1849a9" }}>
              Password
            </label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                borderRadius: "7px",
                border: "1.2px solid #a4cbfd",
                padding: "10px",
                fontSize: "1.03rem",
                marginTop: "3px",
                width: "100%",
                background: "#f8fbff",
              }}
              placeholder="Enter your password"
            />
          </div>
          <button
            type="submit"
            style={{
              width: "100%",
              background:
                "linear-gradient(90deg, #4f8cff 0%, #36d1c4 100%)",
              border: "none",
              color: "#fff",
              fontWeight: 700,
              borderRadius: "7px",
              fontSize: "1.03rem",
              padding: "10px",
              marginTop: "2px",
              boxShadow: "0 2px 10px 0 rgba(45,130,195,0.08)",
              cursor: "pointer"
            }}
          >
            Login
          </button>
        </form>
        {message && (
          <div
            style={{
              marginBottom: "1.1rem",
              textAlign: "center",
              width: "100%",
            }}
          >
            <span
              style={{
                color: "#1060ba",
                fontWeight: 650,
                textDecoration: "underline",
                cursor: "default",
                background: "none",
                border: "none",
                fontSize: "1.08rem",
                padding: "7px 0",
                borderRadius: "5px",
                display: "inline-block",
                letterSpacing: "0.01em",
              }}
              tabIndex={-1}
            >
              {message}
            </span>
          </div>
        )}
        {error && (
          <div
            style={{
              color: "#b01221",
              background: "#ffe5e9",
              fontSize: "1rem",
              marginTop: "1.12rem",
              borderRadius: "5px",
              padding: "8px 12px",
              width: "100%",
              textAlign: "center",
              boxShadow: "0 2px 12px 0 rgba(250, 60, 60, 0.1)",
              border: "1px solid #ffcfd1"
            }}
          >
            {error}
          </div>
        )}
        <div style={{ marginTop: "1.8rem", display: "flex", flexDirection: "column", width: "100%", gap: "11px" }}>
          <button
            type="button"
            onClick={switchToRegister}
            style={{
              background: "none",
              color: "#1976d2",
              fontWeight: 500,
              fontSize: "1.02rem",
              border: "none",
              textAlign: "center",
              cursor: "pointer",
              borderRadius: "6px",
              padding: "0.30rem 0.5rem"
            }}
          >
            Need an account? <span style={{ textDecoration: "underline" }}>Register</span> here
          </button>
          <button
            type="button"
            onClick={switchToForgot}
            style={{
              background: "none",
              color: "#2e6c89",
              fontSize: "1.01rem",
              fontWeight: 400,
              border: "none",
              textAlign: "center",
              cursor: "pointer",
              borderRadius: "6px",
              padding: "0.30rem 0.5rem"
            }}
          >
            Forgot password?
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
