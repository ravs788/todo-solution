import React, { useState, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import TagInput from "./TagInput";
import "./TodoForm.css";

const TodoForm = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [title, setTitle] = useState("");
  const [activityType, setActivityType] = useState("definite");
  const [completed, setCompleted] = useState(false);
  const currentDateTime = new Date().toISOString().slice(0, 16);
  const [startDate, setStartDate] = useState(currentDateTime);
  const [tags, setTags] = useState([]);

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
    payload.tags = tags;
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
      <div className="todoform-fullscreen-bg">
        <div className="todoform-pending-block">
          <h2 className="todoform-pending-heading">Account Pending Approval</h2>
          <p className="todoform-text">
            Your registration is successful but your account is pending approval by an admin.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="todoform-fullscreen-bg">
      <div className="todoform-container">
        <div className="todoform-logo-section">
          <img
            src="/logo192.png"
            alt="Logo"
            className="todoform-logo-img"
          />
        </div>
        <h2 className="todoform-heading">
          Create Todo
        </h2>
        <form
          onSubmit={handleSubmit}
          className="todoform-form"
        >
          <div>
            <label className="todoform-label">
              Title
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Enter todo title"
                className="todoform-input"
              />
            </label>
          </div>
          <div>
            <label className="todoform-label">
              Activity Type
              <select
                className="todoform-select"
                value={activityType}
                onChange={(e) => setActivityType(e.target.value)}
              >
                <option value="definite">Definite End</option>
                <option value="regular">Regular Activity</option>
              </select>
            </label>
          </div>
          {activityType === "definite" && (
            <div className="todoform-checkbox-row">
              <input
                type="checkbox"
                checked={completed}
                onChange={(e) => setCompleted(e.target.checked)}
                id="completedInput"
                className="todoform-checkbox"
              />
              <label htmlFor="completedInput" className="todoform-checkbox-label">
                Completed
              </label>
            </div>
          )}
          <div>
            <label className="todoform-label">
              Start Date
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="todoform-date"
              />
            </label>
          </div>
          <div>
            <label className="todoform-label">
              Tags
              <TagInput
                value={tags}
                onChange={setTags}
                apiBase={process.env.REACT_APP_API_BASE_URL}
              />
            </label>
          </div>
          <div className="todoform-button-row">
            <button
              type="submit"
              className="todoform-btn-primary"
            >
              Create Todo
            </button>
            <button
              type="button"
              onClick={handleBack}
              className="todoform-btn-secondary"
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
