import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import TodoList from "./components/TodoList";
import TodoForm from "./components/TodoForm";
import TodoUpdate from "./components/TodoUpdate";
import TodoDelete from "./components/TodoDelete";
import Login from "./components/Login";
import { AuthProvider } from "./context/AuthContext";

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

  return (
    <AuthProvider>
      {authToken ? (
        <Router>
          <div>
            <h1>Todo List App</h1>
            <nav style={{ marginBottom: "24px" }}>
              <Link to="/" style={{ marginRight: "12px" }}>
                Home
              </Link>
              <Link to="/create" style={{ marginRight: "12px" }}>
                Create Todo
              </Link>
              <button onClick={handleLogout} style={{ marginLeft: "24px" }}>
                Logout
              </button>
            </nav>
            <Routes>
              <Route path="/" element={<TodoList />} />
              <Route path="/create" element={<TodoForm />} />
              <Route path="/update/:id" element={<TodoUpdate />} />
              <Route path="/delete/:id" element={<TodoDelete />} />
            </Routes>
          </div>
        </Router>
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </AuthProvider>
  );
}

export default App;
