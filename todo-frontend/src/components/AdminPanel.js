import React, { useEffect, useState } from "react";

// Fetches and allows admin to approve users, shows all users/statuses
const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

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

  return (
    <div>
      <h2>Admin Panel &ndash; All Users</h2>
      {loading && <div>Loading...</div>}
      {statusMsg && <div style={{ color: "blue" }}>{statusMsg}</div>}
      <table>
        <thead>
          <tr>
            <th>Username</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 && (
            <tr>
              <td colSpan={3}>No users pending approval.</td>
            </tr>
          )}
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.username}</td>
              <td>{user.status}</td>
              <td>
                {(user.status && user.status.trim().toUpperCase() === "PENDING") ? (
                  <button
                    disabled={loading}
                    onClick={() => approveUser(user.id)}
                  >
                    Approve
                  </button>
                ) : (
                  <span style={{ color: "green" }}>-</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminPanel;
