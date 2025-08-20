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

  // Filter states
  const [titleFilter, setTitleFilter] = useState("");
  const [completedFilter, setCompletedFilter] = useState(""); // "", true, false

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

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

  // Filter logic with improved date handling
  const filteredTodos = todos
    .filter((todo) =>
      titleFilter ? todo.title.toLowerCase().includes(titleFilter.toLowerCase()) : true
    )
    .filter((todo) =>
      completedFilter === ""
        ? true
        : completedFilter === "true"
        ? todo.completed === true
        : todo.completed === false
    );

  const totalPages = Math.ceil(filteredTodos.length / pageSize);
  const pagedTodos = filteredTodos.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  useEffect(() => {
    setCurrentPage(1); // Reset page on filter change
  }, [titleFilter, completedFilter, todos]);

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
      {/* Filter controls */}
      <div className="row g-3 mb-3">
        <div className="col-md-6">
          <input
            type="text"
            className="form-control"
            placeholder="Filter by Title"
            value={titleFilter}
            onChange={e => setTitleFilter(e.target.value)}
          />
        </div>
        <div className="col-md-3">
          <select
            className="form-select"
            value={completedFilter}
            onChange={e => setCompletedFilter(e.target.value)}
          >
            <option value="">All</option>
            <option value="true">Completed</option>
            <option value="false">Not Completed</option>
          </select>
        </div>
      </div>
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
          {pagedTodos.map((todo) => (
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
          {pagedTodos.length === 0 && (
            <tr>
              <td colSpan={5} style={{ textAlign: "center", color: "#888" }}>
                No todos found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="d-flex justify-content-center align-items-center my-3">
          <button
            className="btn btn-outline-primary btn-sm mx-1"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Prev
          </button>
          <span style={{ fontWeight: 600, margin: "0 10px" }}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            className="btn btn-outline-primary btn-sm mx-1"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default TodoList;
