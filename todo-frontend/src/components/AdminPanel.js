import React, { useEffect, useState } from "react";

// Fetches and allows admin to approve users, shows all users/statuses
const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [view, setView] = useState("ACTIVE"); // Dropdown: "ACTIVE" or "PENDING"

  // Get current token for auth header
  const jwtToken = localStorage.getItem("jwtToken");

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const apiBase = process.env.REACT_APP_API_BASE_URL;
      const resp = await fetch(`${apiBase}/api/admin/all-users`, {
        headers: {
          "Authorization": `Bearer ${jwtToken}`,
        },
      });
      if (resp.ok) {
        const data = await resp.json();
        setUsers(data);
        setStatusMsg("");
      } else {
        setStatusMsg("Failed to fetch users.");
      }
    } catch {
      setStatusMsg("Error contacting server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line
  }, []);

  const approveUser = async (userId) => {
    setLoading(true);
    try {
      const apiBase = process.env.REACT_APP_API_BASE_URL;
      const resp = await fetch(
        `${apiBase}/api/admin/approve-user/${userId}`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${jwtToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (resp.ok) {
        setStatusMsg("User approved.");
        // Update user status in state
        setUsers((prev) =>
          prev.map((u) =>
            u.id === userId ? { ...u, status: "ACTIVE" } : u
          )
        );
      } else {
        setStatusMsg("Failed to approve user.");
      }
    } catch {
      setStatusMsg("Server error on approval.");
    } finally {
      setLoading(false);
    }
  };

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // Filter and sort users
  let visibleUsers = [];
  if (view === "ACTIVE") {
    visibleUsers = users
      .filter(
        (u) =>
          u.status &&
          u.status.trim().toUpperCase() === "ACTIVE" &&
          u.username.toLowerCase() !== "admin"
      )
      .sort((a, b) => {
        // Prefer createdAt descending, else id descending
        if (a.createdAt && b.createdAt) {
          return new Date(b.createdAt) - new Date(a.createdAt);
        } else if (b.id && a.id) {
          return b.id - a.id;
        }
        return 0;
      });
  } else if (view === "PENDING") {
    visibleUsers = users.filter(
      (u) =>
        u.status &&
        u.status.trim().toUpperCase() === "PENDING"
    );
  }

  // Pagination logic
  const totalPages = Math.ceil(visibleUsers.length / pageSize);
  const paginatedUsers = visibleUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Change page and keep in bound
  const gotoPage = (n) => {
    if (n < 1) n = 1;
    else if (n > totalPages) n = totalPages;
    setCurrentPage(n);
  };

  // Reset to first page when filter changes or users change
  useEffect(() => { setCurrentPage(1); }, [view, users]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(120deg, #e0e7ff 0%, #d0fcfa 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "18px",
          boxShadow: "0 6px 36px 0 rgba(38,80,160,0.16)",
          maxWidth: "500px",
          width: "98%",
          padding: "38px 24px 32px 24px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div style={{ marginBottom: "13px" }}>
          <img
            src="/logo192.png"
            alt="Logo"
            style={{
              width: "54px",
              borderRadius: "13px",
              boxShadow: "0 1px 6px 0 #ddd",
            }}
          />
        </div>
        <h2 style={{ fontWeight: 700, margin: 0, color: "#174bb7", fontSize: "2rem", letterSpacing: "0.02em" }}>
          Admin Panel &ndash; All Users
        </h2>
        <div style={{ marginTop: "19px", marginBottom: "23px", width: "100%" }}>
          <label style={{ fontWeight: 600, color: "#1976d2", marginRight: "12px", fontSize: "1.05rem" }}>
            View:{" "}
            <select
              value={view}
              onChange={e => setView(e.target.value)}
              style={{
                borderRadius: "7px",
                border: "1.5px solid #a4cbfd",
                padding: "7px 19px 7px 11px",
                fontSize: "1.08rem",
                marginLeft: "10px",
                background: "#f8fbff",
                color: "#1849a9"
              }}
            >
              <option value="ACTIVE">Active Users</option>
              <option value="PENDING">Pending Users</option>
            </select>
          </label>
        </div>
        {loading && (
          <div style={{
            color: "#1770b8",
            fontWeight: 500,
            fontSize: "1.04rem",
            marginTop: "16px",
            marginBottom: "8px"
          }}>Loading...</div>
        )}
        {statusMsg && (
          <div style={{
            color: statusMsg.match(/approved|success/i) ? "#108c2c" : "#3d5fc4",
            background: "#f4f6ff",
            padding: "8px 13px",
            fontWeight: 600,
            borderRadius: "7px",
            margin: "10px 0 15px 0"
          }}>
            {statusMsg}
          </div>
        )}
        <div style={{ width: "100%", overflowX: "auto", marginTop: "9px" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginTop: "0.3rem",
              borderRadius: "10px",
              boxShadow: "0 1px 10px 0 #dce0fd",
              background: "#f9fbfc"
            }}
          >
            <thead>
              <tr>
                <th style={{
                  padding: "12px 8px 8px 8px",
                  fontSize: "1.02rem",
                  fontWeight: 700,
                  color: "#2c317a",
                  borderBottom: "2px solid #d8e6fd",
                  background: "#e3f0ff"
                }}>Username</th>
                <th style={{
                  padding: "12px 8px 8px 8px",
                  fontSize: "1.02rem",
                  fontWeight: 700,
                  color: "#2c317a",
                  borderBottom: "2px solid #d8e6fd",
                  background: "#e3f0ff"
                }}>Status</th>
                <th style={{
                  padding: "12px 8px 8px 8px",
                  fontSize: "1.02rem",
                  fontWeight: 700,
                  color: "#2c317a",
                  borderBottom: "2px solid #d8e6fd",
                  background: "#e3f0ff"
                }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {visibleUsers.length === 0 && (
                <tr>
                  <td colSpan={3} style={{ textAlign: "center", padding: "21px 0", color: "#a0a5bb" }}>
                    {view === "ACTIVE" ? "No active users." : "No users pending approval."}
                  </td>
                </tr>
              )}
              {paginatedUsers.map((user) => (
                <tr key={user.id}
                  style={{
                    background: user.status && user.status.trim().toUpperCase() === "PENDING" ? "#f9e5db" : "#f9fbfc"
                  }}>
                  <td style={{
                    padding: "9px 10px",
                    borderBottom: "1.2px solid #e1e9fb"
                  }}>{user.username}</td>
                  <td style={{
                    padding: "9px 10px",
                    borderBottom: "1.2px solid #e1e9fb",
                    color: user.status && user.status.trim().toUpperCase() === "ACTIVE" ? "#049848" : "#cf7500",
                    fontWeight: 600
                  }}>{user.status}</td>
                  <td style={{
                    padding: "9px 10px",
                    borderBottom: "1.2px solid #e1e9fb",
                    textAlign: "center"
                  }}>
                    {(view === "PENDING" && user.status && user.status.trim().toUpperCase() === "PENDING") ? (
                      <button
                        disabled={loading}
                        onClick={() => approveUser(user.id)}
                        style={{
                          background: "linear-gradient(90deg, #13cd67 0%, #1b99cc 100%)",
                          color: "#fff",
                          border: "none",
                          borderRadius: "6px",
                          padding: "6px 14px",
                          fontWeight: 700,
                          fontSize: "1.02rem",
                          cursor: loading ? "not-allowed" : "pointer",
                          boxShadow: "0 1px 8px 0 #e2edf7"
                        }}
                      >
                        Approve
                      </button>
                    ) : (
                      <span style={{ color: "#6db843", fontWeight: 600 }}>-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination controls */}
        {totalPages > 1 && (
          <div style={{ marginTop: 18, display: "flex", justifyContent: "center", alignItems: "center" }}>
            <button
              disabled={currentPage === 1}
              onClick={() => gotoPage(currentPage - 1)}
              style={{
                marginRight: 10,
                padding: "4px 12px",
                borderRadius: "4px",
                border: "1px solid #aaa",
                background: currentPage === 1 ? "#eee" : "#e7f1fd",
                color: "#11447b",
                fontWeight: 600,
                cursor: currentPage === 1 ? "not-allowed" : "pointer"
              }}
            >
              Prev
            </button>
            <span style={{ margin: "0 10px", fontWeight: 600, color: "#2b399a" }}>
              Page {currentPage} of {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => gotoPage(currentPage + 1)}
              style={{
                marginLeft: 10,
                padding: "4px 12px",
                borderRadius: "4px",
                border: "1px solid #aaa",
                background: currentPage === totalPages ? "#eee" : "#e7f1fd",
                color: "#11447b",
                fontWeight: 600,
                cursor: currentPage === totalPages ? "not-allowed" : "pointer"
              }}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
