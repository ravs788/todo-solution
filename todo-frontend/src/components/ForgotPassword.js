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
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(120deg, #e0e7ff 0%, #d0fcfa 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
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
          alignItems: "center",
        }}
      >
        <div style={{ marginBottom: "16px" }}>
          <img
            src="/logo192.png"
            alt="Logo"
            style={{
              width: "54px",
              borderRadius: "13px",
              boxShadow: "0 1px 6px 0 #ddd",
            }}
          />
        </div>
        <h2 style={{ fontWeight: 700, margin: 0, color: "#107782", fontSize: "2rem", letterSpacing: "0.02em" }}>
          Forgot Password
        </h2>
        <div style={{ marginBottom: "18px", color: "#3c6e70" }}>
          Reset your account password
        </div>
        <form
          onSubmit={handleSubmit}
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: "1.23rem",
          }}
        >
          <div>
            <label htmlFor="fp-username" style={{ fontWeight: 500, color: "#10848a" }}>Username</label>
            <input
              id="fp-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              type="text"
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
              placeholder="Enter your username"
            />
          </div>
          <div>
            <label htmlFor="fp-password" style={{ fontWeight: 500, color: "#10848a" }}>New Password</label>
            <input
              id="fp-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
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
              placeholder="Type your new password"
            />
          </div>
          <div>
            <label htmlFor="fp-password-confirm" style={{ fontWeight: 500, color: "#10848a" }}>Confirm Password</label>
            <input
              id="fp-password-confirm"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              type="password"
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
              placeholder="Repeat new password"
            />
          </div>
          <button
            type="submit"
            style={{
              width: "100%",
              background: "linear-gradient(90deg, #36d1c4 0%, #4f8cff 100%)",
              border: "none",
              color: "#fff",
              fontWeight: 700,
              borderRadius: "7px",
              fontSize: "1.03rem",
              padding: "10px",
              marginTop: "2px",
              boxShadow: "0 2px 10px 0 rgba(34,124,195,0.08)",
              cursor: "pointer",
            }}
          >
            Reset Password
          </button>
        </form>
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
              border: "1px solid #ffcfd1",
            }}
          >
            {error}
          </div>
        )}
        {message && (
          <div
            style={{
              color: "#19762e",
              background: "#e0ffe5",
              fontSize: "1rem",
              marginTop: "1.12rem",
              borderRadius: "5px",
              padding: "8px 12px",
              width: "100%",
              textAlign: "center",
              boxShadow: "0 2px 12px 0 rgba(39, 150, 44, 0.08)",
              border: "1px solid #9bf6ac",
            }}
          >
            {message}
          </div>
        )}
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
              boxShadow: "0 1px 8px 0 #e2edf7",
            }}
          >
            ← Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
