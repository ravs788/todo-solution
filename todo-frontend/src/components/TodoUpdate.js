import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";

const TodoUpdate = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [title, setTitle] = useState("");
  const [activityType, setActivityType] = useState("definite");
  const [completed, setCompleted] = useState(false);
  const [startDate, setStartDate] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("jwtToken");
    const apiBase = process.env.REACT_APP_API_BASE_URL;
    axios
      .get(`${apiBase}/api/todos/${id}`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        }
      })
      .then((response) => {
        setTitle(response.data.title);
        setActivityType(response.data.activityType || "definite");
        setCompleted(response.data.completed || false);
        const formattedDate = response.data.startDate
          ? response.data.startDate.slice(0, 16)
          : "";
        setStartDate(formattedDate);
      })
      .catch((error) => {
        console.error("Error fetching todo:", error);
      });
  }, [id]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const token = localStorage.getItem("jwtToken");
    const apiBase = process.env.REACT_APP_API_BASE_URL;
    axios
      .put(
        `${apiBase}/api/todos/${id}`,
        {
          title,
          activityType,
          completed,
          startDate,
        },
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        }
      )
      .then(() => {
        navigate("/");
      })
      .catch((error) => {
        console.error("Error updating todo:", error);
      });
  };

  const handleBack = () => {
    navigate("/");
  };

  if (user && user.status === "PENDING") {
    return (
      <div className="container mt-5">
        <div className="card shadow-sm p-4">
          <h2 style={{ color: "orange" }}>Account Pending Approval</h2>
          <p>
            Your registration is successful but your account is pending approval by an admin.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-5">
      <div className="card shadow-sm p-4">
        <h2 className="mb-4 text-warning">Update Todo</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">
              Title:
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="form-control"
                required
              />
            </label>
          </div>
          <div className="mb-3">
            <label className="form-label">
              Activity Type:
              <select
                className="form-select"
                value={activityType}
                onChange={(e) => setActivityType(e.target.value)}
              >
                <option value="definite">Definite End</option>
                <option value="regular">Regular Activity</option>
              </select>
            </label>
          </div>
          {activityType === "definite" && (
            <div className="mb-3 form-check">
              <input
                type="checkbox"
                className="form-check-input"
                checked={completed}
                onChange={(e) => setCompleted(e.target.checked)}
                id="completedUpdateInput"
              />
              <label className="form-check-label" htmlFor="completedUpdateInput">
                Completed
              </label>
            </div>
          )}
          <div className="mb-3">
            <label className="form-label">
              Start Date:
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="form-control"
                required
              />
            </label>
          </div>
          <div className="d-flex gap-2">
            <button type="submit" className="btn btn-primary">
              Update Todo
            </button>
            <button
              type="button"
              onClick={handleBack}
              className="btn btn-secondary"
            >
              Back
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TodoUpdate;
