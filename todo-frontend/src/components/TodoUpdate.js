import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

const TodoUpdate = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [completed, setCompleted] = useState(false);
  const [startDate, setStartDate] = useState("");

  useEffect(() => {
    axios
      .get(`http://localhost:8081/api/todos/${id}`)
      .then((response) => {
        setTitle(response.data.title);
        setCompleted(response.data.completed || false);
        // Remove seconds and milliseconds for compatibility with datetime-local
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
    const token = localStorage.getItem("token");
    axios
      .put(
        `http://localhost:8081/api/todos/${id}`,
        {
          title,
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
