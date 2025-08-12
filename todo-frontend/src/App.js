import React, { useState, useEffect, useContext } from "react";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import TodoList from "./components/TodoList";
import TodoForm from "./components/TodoForm";
import TodoUpdate from "./components/TodoUpdate";
import TodoDelete from "./components/TodoDelete";
import Login from "./components/Login";
import Register from "./components/Register";
import AdminPanel from "./components/AdminPanel";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";
import { AuthProvider } from "./context/AuthContext";
import AuthContext from "./context/AuthContext";

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

  const [showRegister, setShowRegister] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [loginMessage, setLoginMessage] = useState("");

  // Extract user info from AuthContext
  function AllRoutes() {
    const { user } = useContext(AuthContext) || {};
    return (
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/reset-password" element={<ResetPassword onSuccess={() => window.location.href = "/"} />} />

          {/* Authenticated Area */}
          {authToken ? (
            <Route
              path="/*"
              element={
                <div>
                  <h1>Todo List App</h1>
                  <nav
                    style={{
                      marginBottom: "28px",
                      display: "flex",
                      alignItems: "center",
                      background:
                        "linear-gradient(90deg, #4f8cff 0%, #36d1c4 100%)",
                      borderRadius: "10px",
                      padding: "10px 30px 10px 16px",
                      boxShadow: "0 2px 12px 0 rgba(60,70,120,0.10)",
                      fontSize: "1.11rem",
                      color: "#fff",
                    }}
                  >
                    <Link
                      to="/"
                      style={{
                        color: "#fff",
                        fontWeight: 700,
                        textDecoration: "none",
                        marginRight: "24px",
                      }}
                    >
                      Home
                    </Link>
                    <Link
                      to="/create"
                      style={{
                        color: "#fff",
                        fontWeight: 500,
                        textDecoration: "none",
                        marginRight: "18px",
                      }}
                    >
                      Create Todo
                    </Link>
                    {user && (user.role === "ADMIN" || (user.authorities && user.authorities.includes("ROLE_ADMIN"))) && (
                      <Link
                        to="/admin"
                        style={{
                          color: "#fff",
                          fontWeight: 500,
                          textDecoration: "none",
                          marginRight: "18px",
                        }}
                      >
                        Admin Panel
                      </Link>
                    )}
                    <span style={{ flexGrow: 1 }}></span>
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
                    <Route path="/update/:id" element={<TodoUpdate />} />
                    <Route path="/delete/:id" element={<TodoDelete />} />
                    {(user && (user.role === "ADMIN" || (user.authorities && user.authorities.includes("ROLE_ADMIN")))) && (
                      <Route path="/admin" element={<AdminPanel />} />
                    )}
                  </Routes>
                </div>
              }
            />
          ) : (
            <>
              {showForgot ? (
                <Route
                  path="*"
                  element={
                    <ForgotPassword
                      switchToLogin={() => {
                        setLoginMessage("Password has been reset.");
                        setShowForgot(false);
                      }}
                    />
                  }
                />
              ) : showRegister ? (
                <Route
                  path="*"
                  element={
                    <Register
                      switchToLogin={() => setShowRegister(false)}
                      onRegistered={() => setShowRegister(false)}
                    />
                  }
                />
              ) : (
                <Route
                  path="*"
                  element={
                    <Login
                      message={loginMessage}
                      onLogin={handleLogin}
                      switchToRegister={() => setShowRegister(true)}
                      switchToForgot={() => setShowForgot(true)}
                      onRender={() => setLoginMessage("")}
                    />
                  }
                />
              )}
            </>
          )}
        </Routes>
      </Router>
    );
  }

  return (
    <AuthProvider>
      <AllRoutes />
    </AuthProvider>
  );
}

export default App;
