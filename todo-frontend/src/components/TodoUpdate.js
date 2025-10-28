import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import TagInput from "./TagInput";
import "../css/components/TodoUpdate.css";

const TodoUpdate = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [title, setTitle] = useState("");
  const [activityType, setActivityType] = useState("definite");
  const [completed, setCompleted] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [tags, setTags] = useState([]);

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
        if (response.data.tags) {
          setTags(response.data.tags.map(tag => tag.name));
        }
      })
      .catch((error) => {
        console.error("Error fetching todo:", error);
      });
  }, [id]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const token = localStorage.getItem("jwtToken");
    const apiBase = process.env.REACT_APP_API_BASE_URL;
    let endDate = null;
    if (activityType === "definite" && completed) {
      endDate = new Date().toISOString();
    }

    // Convert the date-time-local value to full ISO string
    const isoStart = new Date(startDate).toISOString();

    const payload = {
      title,
      activityType,
      startDate: isoStart,
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
      .put(
        `${apiBase}/api/todos/${id}`,
        payload,
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
      <div className="todoupdate-fullscreen-bg">
        <div className="todoupdate-pending-block">
          <h2 className="todoupdate-pending-heading">Account Pending Approval</h2>
          <p className="todoupdate-text">
            Your registration is successful but your account is pending approval by an admin.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="todoupdate-fullscreen-bg">
      <div className="todoupdate-container">
        <div className="todoupdate-logo-section">
          <img
            src="/logo192.png"
            alt="Logo"
            className="todoupdate-logo-img"
          />
        </div>
        <h2 className="todoupdate-heading">
          Update Todo
        </h2>
        <form
          onSubmit={handleSubmit}
          className="todoupdate-form"
        >
          <div>
            <label className="todoupdate-label">
              Title
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="todoupdate-input"
              />
            </label>
          </div>
          <div>
            <label className="todoupdate-label">
              Activity Type
              <select
                className="todoupdate-select"
                value={activityType}
                onChange={(e) => setActivityType(e.target.value)}
              >
                <option value="definite">Definite End</option>
                <option value="regular">Regular Activity</option>
              </select>
            </label>
          </div>
          {activityType === "definite" && (
            <div className="todoupdate-checkbox-row">
              <input
                type="checkbox"
                checked={completed}
                onChange={(e) => setCompleted(e.target.checked)}
                id="completedUpdateInput"
                className="todoupdate-checkbox"
              />
              <label htmlFor="completedUpdateInput" className="todoupdate-checkbox-label">
                Completed
              </label>
            </div>
          )}
          <div>
            <label className="todoupdate-label">
              Start Date
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="todoupdate-date"
              />
            </label>
          </div>
          <div>
            <label className="todoupdate-label">
              Tags
              <TagInput
                value={tags}
                onChange={setTags}
                apiBase={process.env.REACT_APP_API_BASE_URL}
              />
            </label>
          </div>
          <div className="todoupdate-button-row">
            <button
              type="submit"
              className="todoupdate-btn-primary"
            >
              Update Todo
            </button>
            <button
              type="button"
              onClick={handleBack}
              className="todoupdate-btn-secondary"
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
