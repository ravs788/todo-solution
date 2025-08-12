import React, { useState } from "react";

const ResetPassword = ({ tokenProp, onSuccess }) => {
  // Accept token as a prop or from query string
  const [token, setToken] = useState(tokenProp || "");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // On mount, if no tokenProp, parse from URL
  React.useEffect(() => {
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
    <div style={{ marginTop: "2rem" }}>
      <h2>Reset Password</h2>
      <form onSubmit={handleSubmit}>
        {!token && (
          <div style={{ color: "red" }}>
            Invalid or missing token.
          </div>
        )}
        <div>
          <label>New Password: </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={!token}
          />
        </div>
        <div>
          <label>Confirm Password: </label>
          <input
            type="password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            required
            disabled={!token}
          />
        </div>
        <button type="submit" disabled={!token}>
          Reset Password
        </button>
      </form>
      {error && <div style={{ color: "red", marginTop: "1rem" }}>{error}</div>}
      {message && (
        <div style={{ color: "green", marginTop: "1rem" }}>{message}</div>
      )}
      <div style={{ marginTop: "2.1rem", display: "flex", flexDirection: "column", width: "100%" }}>
        <button
          type="button"
          onClick={onSuccess}
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
  );
};

export default ResetPassword;
