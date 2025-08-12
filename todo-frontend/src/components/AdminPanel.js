import React, { useEffect, useState } from "react";

// Fetches and allows admin to approve pending users
const AdminPanel = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  // Get current token for auth header
  const jwtToken = localStorage.getItem("jwtToken");

  const fetchPending = async () => {
    setLoading(true);
    try {
      const apiBase = process.env.REACT_APP_API_BASE_URL;
      const resp = await fetch(`${apiBase}/api/admin/pending-users`, {
        headers: {
          "Authorization": `Bearer ${jwtToken}`,
        },
      });
      if (resp.ok) {
        const users = await resp.json();
        setPendingUsers(users);
        setStatusMsg("");
      } else {
        setStatusMsg("Failed to fetch pending users.");
      }
    } catch {
      setStatusMsg("Error contacting server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
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
        setPendingUsers((prev) => prev.filter((u) => u.id !== userId));
      } else {
        setStatusMsg("Failed to approve user.");
      }
    } catch {
      setStatusMsg("Server error on approval.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Admin Panel &ndash; Pending User Approvals</h2>
      {loading && <div>Loading...</div>}
      {statusMsg && <div style={{ color: "blue" }}>{statusMsg}</div>}
      <ul>
        {pendingUsers.length === 0 && <li>No users pending approval.</li>}
        {pendingUsers.map((user) => (
          <li key={user.id}>
            {user.username} (status: {user.status || "PENDING"})
            <button
              style={{ marginLeft: "12px" }}
              disabled={loading}
              onClick={() => approveUser(user.id)}
            >
              Approve
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AdminPanel;
