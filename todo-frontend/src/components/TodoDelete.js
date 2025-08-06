import React from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

const TodoDelete = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const handleDelete = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No token found. Please log in again.");
      navigate("/login");
      return;
    }
    axios
      .delete(`/api/todos/${id}`, {
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

  return (
    <div className="container mt-5">
      <div className="card shadow-sm text-center p-4">
        <h2 className="mb-3 text-danger">Confirm Deletion</h2>
        <p className="mb-4">Are you sure you want to delete this todo item?</p>
        <div className="d-flex justify-content-center gap-2">
          <button onClick={handleDelete} className="btn btn-danger">
            Yes, Delete
          </button>
          <button onClick={handleCancel} className="btn btn-secondary">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default TodoDelete;
