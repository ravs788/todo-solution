import React, { useState, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";

const TodoForm = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [title, setTitle] = useState("");
  const [activityType, setActivityType] = useState("definite");
  const [completed, setCompleted] = useState(false);
  const currentDateTime = new Date().toISOString().slice(0, 16);
  const [startDate, setStartDate] = useState(currentDateTime);

  const handleSubmit = (e) => {
    e.preventDefault();
    const token = localStorage.getItem("jwtToken");
    const apiBase = process.env.REACT_APP_API_BASE_URL;
    let endDate = null;
    // Only capture end date if definite activity and completed is checked
    if (activityType === "definite" && completed) {
      endDate = new Date().toISOString();
    }
    const payload = {
      title,
      activityType,
      startDate,
    };
    if (activityType === "definite") {
      payload.completed = completed;
      payload.endDate = endDate;
    } else {
      payload.completed = false;
      payload.endDate = null;
    }
    axios
      .post(
        `${apiBase}/api/todos`,
        payload,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        }
      )
      .then((response) => {
        navigate("/");
      })
      .catch((error) => {
        console.error("Error creating todo:", error);
      });
  };

  const handleBack = () => {
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
        <h2 style={{ fontWeight: 700, margin: 0, color: "#107782", fontSize: "2rem", letterSpacing: "0.02em" }}>
          Create Todo
        </h2>
        <form
          onSubmit={handleSubmit}
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: "1.23rem",
            marginTop: "18px"
          }}
        >
          <div>
            <label style={{ fontWeight: 500, color: "#10848a" }}>
              Title
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Enter todo title"
                style={{
                  borderRadius: "7px",
                  border: "1.2px solid #a4cbfd",
                  padding: "10px",
                  fontSize: "1.03rem",
                  marginTop: "3px",
                  width: "100%",
                  background: "#f8fbff"
                }}
              />
            </label>
          </div>
          <div>
            <label style={{ fontWeight: 500, color: "#10848a" }}>
              Activity Type
              <select
                style={{
                  borderRadius: "7px",
                  border: "1.2px solid #a4cbfd",
                  padding: "8px",
                  fontSize: "1.03rem",
                  marginTop: "3px",
                  width: "100%",
                  background: "#f8fbff"
                }}
                value={activityType}
                onChange={(e) => setActivityType(e.target.value)}
              >
                <option value="definite">Definite End</option>
                <option value="regular">Regular Activity</option>
              </select>
            </label>
          </div>
          {activityType === "definite" && (
            <div style={{ display: "flex", alignItems: "center", marginLeft: "0.35rem" }}>
              <input
                type="checkbox"
                checked={completed}
                onChange={(e) => setCompleted(e.target.checked)}
                id="completedInput"
                style={{ marginRight: "9px", width: "17px", height: "17px" }}
              />
              <label htmlFor="completedInput" style={{ color: "#1976d2", fontWeight: 500 }}>
                Completed
              </label>
            </div>
          )}
          <div>
            <label style={{ fontWeight: 500, color: "#10848a" }}>
              Start Date
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
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
              />
            </label>
          </div>
          <div style={{ display: "flex", gap: "7px" }}>
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
                cursor: "pointer"
              }}
            >
              Create Todo
            </button>
            <button
              type="button"
              onClick={handleBack}
              style={{
                width: "100%",
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
              Back
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TodoForm;
