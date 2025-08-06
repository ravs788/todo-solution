import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const TodoForm = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [completed, setCompleted] = useState(false);
  const currentDateTime = new Date().toISOString().slice(0, 16);
  const [startDate, setStartDate] = useState(currentDateTime);

  const handleSubmit = (e) => {
    e.preventDefault();
    const token = localStorage.getItem("jwtToken");
    axios
      .post(
        "http://localhost:8081/api/todos",
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
      .then((response) => {
        console.log("Todo created:", response.data);
        navigate("/");
      })
      .catch((error) => {
        console.error("Error creating todo:", error);
      });
  };

  const handleBack = () => {
    navigate("/");
  };

  return (
    <div className="container mt-5">
      <div className="card shadow-sm p-4">
        <h2 className="mb-4 text-primary">Create Todo</h2>
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
                placeholder="Enter todo title"
              />
            </label>
          </div>
          <div className="mb-3 form-check">
            <input
              type="checkbox"
              className="form-check-input"
              checked={completed}
              onChange={(e) => setCompleted(e.target.checked)}
              id="completedInput"
            />
            <label className="form-check-label" htmlFor="completedInput">
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
            <button type="submit" className="btn btn-success">
              Create Todo
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

export default TodoForm;
