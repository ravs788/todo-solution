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
      <div className="container mt-5">
        <div className="card shadow-sm text-center p-4">
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
