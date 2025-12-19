import React from "react";
import { useNavigate } from "react-router-dom";

const TopBar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    try { localStorage.removeItem("jwtToken"); } catch {}
    try { sessionStorage.clear(); } catch {}
    navigate("/login", { replace: true });
  };

  return (
    <div style={{
      width: "100%",
      background: "linear-gradient(90deg, #e3f0ff 0%, #c5e9ff 100%)",
      boxShadow: "0 2px 8px #dce0fd",
      display: "flex",
      alignItems: "center",
      justifyContent: "flex-end",
      height: "52px",
      padding: "0 17px",
      zIndex: 1000,
      position: "sticky",
      top: 0
    }}>
      <button
        type="button"
        aria-label="Logout"
        style={{
          background: "linear-gradient(90deg, #2384ff 0%, #19d256 100%)",
          color: "#fff",
          border: "none",
          borderRadius: "7px",
          fontWeight: 700,
          fontSize: "1.04rem",
          padding: "8px 24px",
          minWidth: "100px",
          boxShadow: "0 1px 8px 0 #e2edf7",
          cursor: "pointer"
        }}
        onClick={handleLogout}
      >
        Logout
      </button>
    </div>
  );
};

export default TopBar;
