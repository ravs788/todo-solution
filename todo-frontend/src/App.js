import React, { useState, useEffect, useContext } from "react";
import { BrowserRouter as Router, Route, Routes, Link, useNavigate } from "react-router-dom";
import TodoList from "./components/TodoList";
import TodoForm from "./components/TodoForm";
import TodoUpdate from "./components/TodoUpdate";
import TodoDelete from "./components/TodoDelete";
import TodoDetails from "./components/TodoDetails";
import Settings from "./components/Settings";
import Login from "./components/Login";
import Register from "./components/Register";
import AdminPanel from "./components/AdminPanel";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";
import ThemeToggle from "./components/ThemeToggle";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider } from "./context/ToastContext";
import AuthContext from "./context/AuthContext";
import ToastContainer from "./components/ToastContainer";

function AllRoutes({ authToken, handleLogin, handleLogout, loginMessage, setLoginMessage }) {
  const { user } = useContext(AuthContext) || {};
  const navigate = useNavigate();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/reset-password" element={<ResetPassword onSuccess={() => window.location.href = "/"} />} />
      <Route
        path="/forgot-password"
        element={
          <ForgotPassword
            switchToLogin={() => {
              setLoginMessage("Password has been reset.");
              navigate("/", { replace: false });
            }}
          />
        }
      />
      <Route
        path="/register"
        element={
          <Register
            switchToLogin={() => navigate("/", { replace: false })}
            onRegistered={() => navigate("/", { replace: false })}
          />
        }
      />
      {authToken ? (
        <Route
          path="/*"
          element={
            <div className="theme-text-primary" style={{
              minHeight: '100vh',
              color: 'var(--text-primary) !important'
            }}>
              <h1 className="theme-text-primary" style={{
                marginBottom: '20px'
              }}>Todo List App</h1>
              <nav
                style={{
                  marginBottom: "28px",
                  display: "flex",
                  alignItems: "center",
                  background: "var(--navbar-bg)",
                  borderRadius: "10px",
                  padding: "10px 30px 10px 16px",
                  boxShadow: "0 2px 12px 0 var(--shadow-color)",
                  fontSize: "1.11rem",
                  color: "var(--navbar-text)",
                  transition: "background 0.3s ease, box-shadow 0.3s ease",
                }}
              >
                <Link
                  to="/"
                  style={{
                    color: "var(--navbar-text)",
                    fontWeight: 700,
                    textDecoration: "none",
                    marginRight: "24px",
                    transition: "color 0.3s ease",
                  }}
                >
                  Home
                </Link>
                <Link
                  to="/create"
                  style={{
                    color: "var(--navbar-text)",
                    fontWeight: 500,
                    textDecoration: "none",
                    marginRight: "18px",
                    transition: "color 0.3s ease",
                  }}
                >
                  Create Todo
                </Link>
                <Link
                  to="/settings"
                  style={{
                    color: "var(--navbar-text)",
                    fontWeight: 500,
                    textDecoration: "none",
                    marginRight: "18px",
                    transition: "color 0.3s ease",
                  }}
                >
                  Settings
                </Link>
                {user && (user.role === "ADMIN" || (user.authorities && user.authorities.includes("ROLE_ADMIN"))) && (
                  <Link
                    to="/admin"
                    style={{
                      color: "var(--navbar-text)",
                      fontWeight: 500,
                      textDecoration: "none",
                      marginRight: "18px",
                      transition: "color 0.3s ease",
                    }}
                  >
                    Admin Panel
                  </Link>
                )}
                <span style={{ flexGrow: 1 }}></span>
                <ThemeToggle />
                <button
                  onClick={handleLogout}
                  style={{
                    background: "#fff",
                    color: "#1976d2",
                    fontWeight: 700,
                    border: "none",
                    borderRadius: "5px",
                    padding: "8px 16px",
                    marginLeft: "12px",
                    cursor: "pointer",
                    fontSize: "1rem",
                    boxShadow: "0 2px 8px 0 rgba(30,50,70,0.08)",
                  }}
                >
                  Logout
                </button>
              </nav>
              <Routes>
                <Route path="/" element={<TodoList />} />
                <Route path="/create" element={<TodoForm />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/update/:id" element={<TodoUpdate />} />
                <Route path="/delete/:id" element={<TodoDelete />} />
                <Route path="/todo/:id" element={<TodoDetails />} />
                {(user && (user.role === "ADMIN" || (user.authorities && user.authorities.includes("ROLE_ADMIN")))) && (
                  <Route path="/admin" element={<AdminPanel />} />
                )}
              </Routes>
            </div>
          }
        />
      ) : (
        <Route
          path="*"
          element={
            <Login
              message={loginMessage}
              onLogin={handleLogin}
              switchToRegister={() => navigate("/register", { replace: false })}
              switchToForgot={() => navigate("/forgot-password", { replace: false })}
              onRender={() => setLoginMessage("")}
            />
          }
        />
      )}
    </Routes>
  );
}


function App() {
  const [authToken, setAuthToken] = useState(
    () => localStorage.getItem("jwtToken") || ""
  );

  useEffect(() => {
    // In case localStorage changes elsewhere (e.g. logout/login in another tab)
    function syncAuth() {
      setAuthToken(localStorage.getItem("jwtToken") || "");
    }
    window.addEventListener("storage", syncAuth);
    return () => window.removeEventListener("storage", syncAuth);
  }, []);

  const handleLogin = (token) => {
    setAuthToken(token);
  };

  const handleLogout = () => {
    localStorage.removeItem("jwtToken");
    setAuthToken("");
  };

  const [loginMessage, setLoginMessage] = useState("");

  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <Router>
            <AllRoutes
              authToken={authToken}
              handleLogin={handleLogin}
              handleLogout={handleLogout}
              loginMessage={loginMessage}
              setLoginMessage={setLoginMessage}
            />
            <ToastContainer />
          </Router>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
