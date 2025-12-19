import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import TopBar from "./TopBar";
import AuthContext from "../context/AuthContext";
import ThemeContext from "../context/ThemeContext";
import { useHistory } from "../hooks/useHistory";
import { createCommands } from "../hooks/useCommands";
import { useToast } from "../context/ToastContext";

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
  const { isDarkMode } = useContext(ThemeContext);
  const { push, undo } = useHistory();
  const { showToast } = useToast();

  // Create command factory
  const commands = createCommands(setTodos, showToast);

  // Handlers for undo/redo actions
  const handleToggleComplete = async (todo) => {
    const command = commands.toggleCompleteCommand(todo.id, todo.completed);
    await command.do();
    push(command);
  };

  const handleDelete = async (todo) => {
    const command = commands.deleteTodoCommand(todo.id, {
      title: todo.title,
      description: todo.description || '',
      completed: todo.completed,
      startDate: todo.startDate,
      endDate: todo.endDate,
      tags: todo.tags || []
    });
    await command.do();
    push(command);

    // Prevent multiple toasts: only show Toast if not already present for this todo
    if (
      !(window.__undo_toast_id && window.__undo_toast_for_id === todo.id)
      && !window.__PLAYWRIGHT_TEST_MODE // If running in E2E mode, do not show the undo toast at all
    ) {
      window.__undo_toast_for_id = todo.id;
      window.__undo_toast_id = showToast('Todo deleted successfully', 'success', {
        action: 'Undo',
          onAction: async () => {
            await undo();
            // Hide this toast immediately after successful undo click
            if (window.__undo_toast_id && typeof window.__undo_toast_id === "number" && window.__toastContext && window.__toastContext.removeToast) {
              window.__toastContext.removeToast(window.__undo_toast_id);
            }
            window.__undo_toast_id = undefined;
            window.__undo_toast_for_id = undefined;
            // Show "todo deletion undone" toast for 2 seconds (auto‑dismiss)
            showToast("Todo deletion undone", "info", { duration: 2000 });
          },
        persistent: false,
        duration: 1000 // Changed: only display 1 second, then close immediately
      });
    }
  };

  // Initialize reminder scheduler
  useReminderScheduler();

  // Filter states
  const [titleFilter, setTitleFilter] = useState("");
  const [completedFilter, setCompletedFilter] = useState(""); // "", true, false

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Only fetch todos on mount or if user changed, or after a "refresh-todos" custom event
  useEffect(() => {
    const fetchTodos = async () => {
      try {
        const response = await api.get("/todos");
        setTodos(response.data);
      } catch (error) {
        // Error fetching todos
      }
    };

    // Fetch todos after login/user change (fix first-login bug)
    if (user && user.status === 'ACTIVE') {
      fetchTodos();
    }

    // Listen for a custom event to trigger a todos refresh (e.g., after undo from details)
    const refreshHandler = () => {
      if (user && user.status === 'ACTIVE') {
        fetchTodos();
      }
    };
    window.addEventListener('refresh-todos', refreshHandler);

    // Do not re-fetch due to todos update, only due to user or custom event
    return () => window.removeEventListener('refresh-todos', refreshHandler);
  }, [user]);

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
    <>
      <TopBar />
      <div className="container mt-5 theme-bg-primary theme-text-primary">
        <h2 style={{
          color: "orange",
          transition: 'color 0.3s ease'
        }}>Account Pending Approval</h2>
        <p className="theme-text-secondary">
          Your registration is successful but your account is pending approval by an admin.
        </p>
    </div>
    </>
  );
  }

  return (
    <div className="container mt-5 theme-bg-primary theme-text-primary">
      <header>
        <h2 className="mb-4 theme-text-primary todo-list-title" id="todo-list-heading">
          Todo List
        </h2>
        {user && (
          <Link
            to="/create"
            className="btn btn-primary mb-3"
            aria-describedby="create-todo-description"
          >
            Create New Todo
          </Link>
        )}
        <div id="create-todo-description" className="sr-only">
          Navigate to create a new todo item
        </div>
      </header>

      {/* Filter controls */}
      <section aria-labelledby="filters-heading" className="mb-4">
        <h2 id="filters-heading" className="sr-only">Filter and Search Options</h2>
        <div className="row g-3 filters-row" role="group" aria-labelledby="filters-heading">
          <div className="col-md-6">
            <label htmlFor="title-filter" className="form-label sr-only">
              Filter by Title
            </label>
            <input
              id="title-filter"
              type="text"
              className="form-control"
              placeholder="Filter by Title"
              value={titleFilter}
              onChange={e => setTitleFilter(e.target.value)}
              aria-describedby="title-filter-help"
            />
            <div id="title-filter-help" className="sr-only">
              Type to filter todos by title. Results update automatically.
            </div>
          </div>
          <div className="col-md-3">
            <label htmlFor="status-filter" className="form-label sr-only">
              Filter by Completion Status
            </label>
            <select
              id="status-filter"
              className="form-select"
              value={completedFilter}
              onChange={e => setCompletedFilter(e.target.value)}
              aria-describedby="status-filter-help"
            >
              <option value="">All</option>
              <option value="true">Completed</option>
              <option value="false">Not Completed</option>
            </select>
            <div id="status-filter-help" className="sr-only">
              Select to filter todos by completion status
            </div>
          </div>
        </div>
      </section>
      {/* Todo Table */}
      <section aria-labelledby="todo-table-heading" className="table-responsive">
        <h2 id="todo-table-heading" className="sr-only">Todo Items Table</h2>
        <table
          key={`table-${isDarkMode ? 'dark' : 'light'}`}
          className="custom-table"
          role="table"
          aria-label={`Todo items table showing ${pagedTodos.length} of ${filteredTodos.length} filtered todos`}
        >
        <thead>
          <tr>
            <th style={{ fontSize: "1rem", textTransform: "capitalize" }}>Title</th>
            <th style={{ fontSize: "1rem", textTransform: "capitalize" }}>Completed</th>
            <th style={{ fontSize: "1rem", textTransform: "capitalize" }}>Start Date</th>
            <th style={{ fontSize: "1rem", textTransform: "capitalize" }}>End Date</th>
            <th style={{ fontSize: "1rem", textTransform: "capitalize" }}>Tags</th>
            <th style={{ fontSize: "1rem", textTransform: "capitalize" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {pagedTodos.map((todo, index) => {
            const reminderStatus = todo.reminderAt ? (() => {
              const now = new Date();
              const reminder = new Date(todo.reminderAt);
              const diffMs = reminder - now;
              const diffHours = diffMs / (1000 * 60 * 60);
              const diffDays = diffMs / (1000 * 60 * 60 * 24);
              if (diffMs < 0) return 'overdue';
              else if (diffHours <= 24) return 'due soon';
              else if (diffDays <= 7) return 'due this week';
              else return 'upcoming';
            })() : 'none';

            return (
              <tr
                key={todo.id}
                className={index % 2 === 0 ? 'table-row-even' : 'table-row-odd'}
                style={{ borderBottom: '1px solid var(--table-border)' }}
                role="row"
                aria-label={`Todo: ${todo.title}, ${todo.completed ? 'completed' : 'not completed'}, reminder ${reminderStatus}`}
              >
                <td
                  style={{
                    borderLeft: '1px solid var(--table-border)',
                    borderRight: '1px solid var(--table-border)',
                    padding: '8px'
                  }}
                  className={todo.completed ? "completed-task" : ""}
                  role="cell"
                  aria-describedby={`title-${todo.id}`}
                >
                  <span id={`title-${todo.id}`} className="sr-only">
                    {todo.completed ? 'Completed todo: ' : 'Todo: '}
                  </span>
                  {todo.title && todo.title.length > 40 ? (
                    <>
                      {todo.title.slice(0, 40)}
                      <Link
                        to={`/todo/${todo.id}`}
                        style={{ textDecoration: "none", marginLeft: "2px" }}
                        aria-label={`View full details for ${todo.title}`}
                      >
                        {tagText}
                      </span>
                    );
                    })}
                  </div>
                ) : (
                  <span className="theme-text-secondary" style={{ fontSize: "0.9em" }}>No tags</span>
                )}
              </td>
              <td style={{
                borderRight: '1px solid var(--table-border)',
                padding: '8px'
              }}>
                {user && (
                  <>
                    <Link
                      to={`/todo/${todo.id}`}
                      className="btn btn-sm btn-secondary me-2"
                      style={{
                        textTransform: "capitalize",
                        minWidth: "90px",
                        fontWeight: "bold",
                        fontSize: "0.97rem",
                        borderRadius: "5px",
                        padding: "5px 15px",
                        textAlign: "center"
                      }}
                    >
                      Details
                    </Link>
                    <Link
                      to={`/update/${todo.id}`}
                      className="btn btn-sm btn-primary me-2"
                      disabled={todo.completed}
                      style={{
                        textTransform: "capitalize",
                        minWidth: "90px",
                        fontWeight: "bold",
                        fontSize: "0.97rem",
                        borderRadius: "5px",
                        padding: "5px 15px",
                        opacity: todo.completed ? 0.5 : 1,
                        pointerEvents: todo.completed ? "none" : "auto",
                        textAlign: "center"
                      }}
                    >
                      Update
                    </Link>
                    <button
                      onClick={() => handleDelete(todo)}
                      className="btn btn-sm btn-danger"
                      disabled={todo.completed}
                      style={{
                        textTransform: "capitalize",
                        minWidth: "90px",
                        fontWeight: "bold",
                        fontSize: "0.97rem",
                        borderRadius: "5px",
                        padding: "5px 15px",
                        opacity: todo.completed ? 0.5 : 1,
                        pointerEvents: todo.completed ? "none" : "auto",
                        textAlign: "center"
                      }}
                    >
                      Delete
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
          {pagedTodos.length === 0 && (
            <tr>
              <td colSpan={8} style={{ textAlign: "center" }} className="theme-text-secondary">
                No todos found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      </section>
      {/* Pagination Controls */}
      {totalPages > 1 && (
        <nav aria-labelledby="pagination-heading" className="d-flex align-items-center my-3" style={{ position: "relative" }}>
          <h3 id="pagination-heading" className="sr-only">Pagination Controls</h3>

          {/* Centered page navigation controls */}
          <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)" }}>
            <div className="d-flex align-items-center" role="group" aria-labelledby="page-navigation">
              <span id="page-navigation" className="sr-only">Page navigation</span>
              <button
                className="btn btn-outline-primary btn-sm mx-1"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                aria-label={`Go to previous page, page ${currentPage - 1}`}
                aria-disabled={currentPage === 1}
              >
                Previous
              </button>
              <span
                role="status"
                aria-live="polite"
                aria-atomic="true"
                style={{ fontWeight: 600, margin: "0 10px" }}
              >
                Page {currentPage} of {totalPages}
              </span>
              <button
                className="btn btn-outline-primary btn-sm mx-1"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                aria-label={`Go to next page, page ${currentPage + 1}`}
                aria-disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          </div>

          {/* Page size selection to the far right */}
          <div className="ms-auto d-flex align-items-center" style={{ minWidth: 170, justifyContent: "flex-end" }}>
            <label
              htmlFor="pageSizeSelect"
              style={{ fontWeight: 500, margin: "0 7px 0 0" }}
              id="page-size-label"
            >
              Rows per page:
            </label>
            <select
              id="pageSizeSelect"
              className="form-select form-select-sm"
              value={pageSize}
              onChange={e => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              style={{ width: 70 }}
              aria-labelledby="page-size-label"
              aria-describedby="page-size-help"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
            </select>
            <div id="page-size-help" className="sr-only">
              Select how many todos to display per page. Changing this resets to page 1.
            </div>
          </div>
        </nav>
      )}
    </div>
  );
};

export default TodoList;
