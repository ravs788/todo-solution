import React, { useContext } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";

const TodoDelete = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const handleDelete = () => {
    const token = localStorage.getItem("jwtToken");
    if (!token) {
      // No token found
      navigate("/login");
      return;
    }
    const apiBase = process.env.REACT_APP_API_BASE_URL;
    axios
      .delete(`${apiBase}/api/todos/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then(() => {
        navigate("/");
      })
      .catch((error) => {
        // Error deleting todo
        if (error.response && error.response.status === 403) {
          // Authentication failed. Token might be expired.
          navigate("/login");
        }
      });
  };

  const handleCancel = () => {
    navigate("/");
  };

  if (user && user.status === "PENDING") {
    return (
      <div className="panel-card"
        style={{
          minHeight: "100vh",
          background: "linear-gradient(120deg, var(--bg-primary) 0%, var(--bg-secondary) 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
      <div className="panel-card"
        style={{
            background: "var(--panel-bg)",
            border: "1px solid var(--panel-border)",
            borderRadius: "18px",
            boxShadow: "0 6px 36px 0 var(--panel-shadow)",
            maxWidth: "375px",
            width: "98%",
            padding: "38px 24px 32px 24px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <h2 style={{ color: "var(--accent-gold)" }}>Account Pending Approval</h2>
          <p>
            Your registration is successful but your account is pending approval by an admin.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(120deg, var(--bg-primary) 0%, var(--bg-secondary) 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div className="panel-card"
        style={{
          background: "var(--panel-bg)",
          border: "1px solid var(--panel-border)",
          borderRadius: "18px",
          boxShadow: "0 6px 36px 0 var(--panel-shadow)",
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
              boxShadow: "0 1px 6px 0 var(--shadow-color)",
            }}
          />
        </div>
        <h2 style={{ fontWeight: 700, margin: 0, color: "var(--btn-danger)", fontSize: "2rem", letterSpacing: "0.02em" }}>
          Confirm Deletion
        </h2>
        <p style={{ color: "var(--text-secondary)", marginBottom: "1.1rem", fontSize: "1.04rem" }}>
          Are you sure you want to delete this todo item?
        </p>
        <div style={{ display: "flex", gap: "9px", width: "100%" }}>
          <button
            onClick={handleDelete}
            style={{
              flex: 1,
              background: "var(--btn-danger)",
              border: "none",
              color: "#fff",
              fontWeight: 700,
              borderRadius: "7px",
              fontSize: "1.03rem",
              padding: "10px",
              marginTop: "2px",
              boxShadow: "0 2px 12px 0 var(--shadow-color)",
              cursor: "pointer"
            }}
          >
            Yes, Delete
          </button>
          <button
            onClick={handleCancel}
            style={{
              flex: 1,
              background: "var(--bg-secondary)",
              color: "var(--btn-secondary)",
              border: "1.5px solid var(--border-color)",
              fontWeight: 600,
              fontSize: "1.03rem",
              borderRadius: "7px",
              padding: "10px",
              cursor: "pointer",
              boxShadow: "0 1px 8px 0 var(--shadow-color)"
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default TodoDelete;
