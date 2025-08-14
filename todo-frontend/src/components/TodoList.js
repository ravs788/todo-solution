import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import AuthContext from "../context/AuthContext";

const api = axios.create({
  baseURL: `${process.env.REACT_APP_API_BASE_URL}/api`,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("jwtToken");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const TodoList = () => {
  const [todos, setTodos] = useState([]);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchTodos = async () => {
      try {
        const response = await api.get("/todos");
        setTodos(response.data);
      } catch (error) {
        console.error("Error fetching todos:", error);
      }
    };
    fetchTodos();
  }, []);

  if (user && user.status === "PENDING") {
    return (
      <div className="container mt-5">
        <h2 style={{ color: "orange" }}>Account Pending Approval</h2>
        <p>
          Your registration is successful but your account is pending approval by an admin.
        </p>
      </div>
    );
  }

  return (
    <div className="container mt-5">
      <h2 className="mb-4">Todo List</h2>
      {user && (
        <Link to="/create" className="btn btn-primary mb-3">
          Create New Todo
        </Link>
      )}
      <table className="table table-striped">
        <thead>
          <tr>
            <th>Title</th>
            <th>Completed</th>
            <th>Start Date</th>
            <th>End Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {todos.map((todo) => (
            <tr key={todo.id}>
              <td className={todo.completed ? "completed-task" : ""}>{todo.title}</td>
              <td>{todo.completed ? "Yes" : "No"}</td>
              <td>
                {new Date(todo.startDate).getDate().toString().padStart(2, "0")}
                -
                {new Intl.DateTimeFormat("en", { month: "short" }).format(
                  new Date(todo.startDate)
                )}
                -{new Date(todo.startDate).getFullYear()}
              </td>
              <td>
                {todo.endDate
                  ? (new Date(todo.endDate).getDate().toString().padStart(2, "0") +
                    "-" +
                    new Intl.DateTimeFormat("en", { month: "short" }).format(
                      new Date(todo.endDate)
                    ) +
                    "-" +
                    new Date(todo.endDate).getFullYear())
                  : ""}
              </td>
              <td>
                {user && (
                  <>
                    <Link
                      to={`/update/${todo.id}`}
                      className="btn btn-sm btn-primary me-2"
                      disabled={todo.completed}
                      style={todo.completed ? { pointerEvents: "none", opacity: 0.5 } : {}}
                    >
                      Update
                    </Link>
                    <Link
                      to={`/delete/${todo.id}`}
                      className="btn btn-sm btn-danger"
                      disabled={todo.completed}
                      style={todo.completed ? { pointerEvents: "none", opacity: 0.5 } : {}}
                    >
                      Delete
                    </Link>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TodoList;
