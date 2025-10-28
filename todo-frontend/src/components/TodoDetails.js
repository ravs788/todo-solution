import React, { useEffect, useState, useContext } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import AuthContext from "../context/AuthContext";
import "../css/components/AppCard.css";

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
  (error) => Promise.reject(error)
);

const formatDate = (d) => {
  if (!d) return "";
  const date = new Date(d);
  const dd = date.getDate().toString().padStart(2, "0");
  const mon = new Intl.DateTimeFormat("en", { month: "short" }).format(date);
  const yy = date.getFullYear();
  return `${dd}-${mon}-${yy}`;
};

const TodoDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext) || {};
  const [todo, setTodo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const resp = await api.get(`/todos/${id}`);
        if (isMounted) {
          setTodo(resp.data);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setErrorMsg("Unable to load todo details.");
          setLoading(false);
        }
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [id]);

  return (
    <div className="app-gradient-bg">
      <div className="app-card">
        <h2 className="app-card-title" style={{ marginBottom: "10px" }}>
          Todo Details
        </h2>
        {loading && <div className="theme-text-secondary">Loading...</div>}
        {!loading && errorMsg && (
          <div
            style={{
              color: "var(--btn-danger)",
              background: "#ffe5e9",
              fontSize: "1rem",
              marginTop: "1.12rem",
              borderRadius: "5px",
              padding: "8px 12px",
              width: "100%",
              textAlign: "center",
              boxShadow: "0 2px 12px 0 rgba(250, 60, 60, 0.1)",
              border: "1px solid #ffcfd1",
            }}
          >
            {errorMsg}
          </div>
        )}
        {!loading && !errorMsg && todo && (
          <div style={{ width: "100%" }}>
            <div style={{ marginBottom: "8px" }}>
              <div className="theme-text-secondary" style={{ fontSize: "0.9rem" }}>
                Title
              </div>
              <div className="theme-text-primary" style={{ fontWeight: 600, fontSize: "1.1rem", wordBreak: "break-word" }}>
                {todo.title}
              </div>
            </div>

            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginTop: "10px" }}>
              <div>
                <div className="theme-text-secondary" style={{ fontSize: "0.9rem" }}>
                  Completed
                </div>
                <div className="theme-text-primary" style={{ fontWeight: 600 }}>
                  {todo.completed ? "Yes" : "No"}
                </div>
              </div>
              <div>
                <div className="theme-text-secondary" style={{ fontSize: "0.9rem" }}>
                  Start Date
                </div>
                <div className="theme-text-primary" style={{ fontWeight: 600 }}>
                  {formatDate(todo.startDate)}
                </div>
              </div>
              <div>
                <div className="theme-text-secondary" style={{ fontSize: "0.9rem" }}>
                  End Date
                </div>
                <div className="theme-text-primary" style={{ fontWeight: 600 }}>
                  {todo.endDate ? formatDate(todo.endDate) : ""}
                </div>
              </div>
            </div>

            <div style={{ marginTop: "12px" }}>
              <div className="theme-text-secondary" style={{ fontSize: "0.9rem" }}>
                Tags
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "4px" }}>
                {todo.tags && todo.tags.length > 0 ? (
                  todo.tags.map((t) => {
                    const tagText = typeof t === "string" ? t : t.name;
                    return (
                      <span
                        key={tagText}
                        style={{
                          background: "var(--tag-bg)",
                          color: "var(--tag-text)",
                          borderRadius: "4px",
                          padding: "2px 6px",
                          fontSize: "0.85em",
                        }}
                      >
                        {tagText}
                      </span>
                    );
                  })
                ) : (
                  <span className="theme-text-secondary" style={{ fontSize: "0.9em" }}>
                    No tags
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "18px" }}>
              <button
                onClick={() => navigate(-1)}
                className="app-button-secondary"
                style={{ flex: 1 }}
              >
                Back
              </button>

              {user && (
                <>
                  <Link
                    to={`/update/${todo.id}`}
                    className="app-button-secondary"
                    style={{ flex: 1, background: "var(--btn-primary)", color: "#fff", border: "none", textDecoration: "none", textAlign: "center" }}
                  >
                    Update
                  </Link>
                  <Link
                    to={`/delete/${todo.id}`}
                    className="app-button-secondary"
                    style={{ flex: 1, background: "var(--btn-danger)", color: "#fff", border: "none", textDecoration: "none", textAlign: "center" }}
                  >
                    Delete
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TodoDetails;
