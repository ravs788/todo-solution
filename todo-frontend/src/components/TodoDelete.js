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
      console.error("No token found. Please log in again.");
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
        console.error("Error deleting todo:", error);
        if (error.response && error.response.status === 403) {
          console.error(
            "Authentication failed. Token might be expired. Please log in again."
          );
          navigate("/login");
        }
      });
  };

  const handleCancel = () => {
    navigate("/");
  };

  if (user && user.status === "PENDING") {
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
          <h2 style={{ color: "orange" }}>Account Pending Approval</h2>
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
        <h2 style={{ fontWeight: 700, margin: 0, color: "#b01221", fontSize: "2rem", letterSpacing: "0.02em" }}>
          Confirm Deletion
        </h2>
        <p style={{ color: "#8d1b1b", marginBottom: "1.1rem", fontSize: "1.04rem" }}>
          Are you sure you want to delete this todo item?
        </p>
        <div style={{ display: "flex", gap: "9px", width: "100%" }}>
          <button
            onClick={handleDelete}
            style={{
              flex: 1,
              background: "linear-gradient(90deg, #f2203e 0%, #d9006e 100%)",
              border: "none",
              color: "#fff",
              fontWeight: 700,
              borderRadius: "7px",
              fontSize: "1.03rem",
              padding: "10px",
              marginTop: "2px",
              boxShadow: "0 2px 12px 0 rgba(250, 60, 60, 0.13)",
              cursor: "pointer"
            }}
          >
            Yes, Delete
          </button>
          <button
            onClick={handleCancel}
            style={{
              flex: 1,
              background: "#f3f6fb",
              color: "#1849a9",
              border: "1.5px solid #bcd5ee",
              fontWeight: 600,
              fontSize: "1.03rem",
              borderRadius: "7px",
              padding: "10px",
              cursor: "pointer",
              boxShadow: "0 1px 8px 0 #e2edf7"
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
