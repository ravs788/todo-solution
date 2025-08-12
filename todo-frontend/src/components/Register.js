import React, { useState } from "react";

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
        <h2 style={{ fontWeight: 700, margin: 0, color: "#107782", fontSize: "2rem", letterSpacing: "0.02em" }}>Create Account</h2>
        <div style={{ marginBottom: "18px", color: "#3c6e70" }}>Join and start managing your todos</div>
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
            <label style={{ fontWeight: 500, color: "#10848a" }}>Username</label>
            <input
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
                background: "#f8fbff"
              }}
              placeholder="Your username"
            />
          </div>
          <div>
            <label style={{ fontWeight: 500, color: "#10848a" }}>Password</label>
            <input
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
                background: "#f8fbff"
              }}
              placeholder="Choose password"
            />
          </div>
          <div>
            <label style={{ fontWeight: 500, color: "#10848a" }}>Confirm Password</label>
            <input
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
                background: "#f8fbff"
              }}
              placeholder="Repeat password"
            />
          </div>
          <button
            type="submit"
            style={{
              width: "100%",
              background:
                "linear-gradient(90deg, #36d1c4 0%, #4f8cff 100%)",
              border: "none",
              color: "#fff",
              fontWeight: 700,
              borderRadius: "7px",
              fontSize: "1.03rem",
              padding: "10px",
              marginTop: "2px",
              boxShadow: "0 2px 10px 0 rgba(34,124,195,0.08)",
              cursor: "pointer"
            }}
          >
            Register
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
              border: "1px solid #ffcfd1"
            }}
          >
            {error}
          </div>
        )}
        {success && (
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
              border: "1px solid #9bf6ac"
            }}
          >
            {success}
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
              boxShadow: "0 1px 8px 0 #e2edf7"
            }}
          >
            ← Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default Register;
