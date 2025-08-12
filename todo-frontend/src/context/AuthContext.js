// src/context/AuthContext.js
import React, { createContext, useState, useEffect } from "react";

const AuthContext = createContext();

// Simple decoder for JWT payload
function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("jwtToken");
    if (token) {
      console.log("JWT token from storage:", token);
      const payload = parseJwt(token);
      console.log("Decoded JWT payload from storage:", payload); // DEBUG LOG
      if (payload && payload.sub) {
        setUser({
          username: payload.sub,
          role: payload.role || "USER",
          status: payload.status || "ACTIVE"
        });
      }
    }
  }, []);

  const login = (token) => {
    localStorage.setItem("jwtToken", token);
    console.log("JWT token on login:", token);
    const payload = parseJwt(token);
    console.log("Decoded JWT payload on login:", payload); // DEBUG LOG
    if (payload && payload.sub) {
      setUser({
        username: payload.sub,
        role: payload.role || "USER",
        status: payload.status || "ACTIVE"
      });
    } else {
      setUser(null);
    }
  };

  const logout = () => {
    localStorage.removeItem("jwtToken");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
