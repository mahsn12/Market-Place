import React, { useEffect, useState } from "react";
import { getAllUsers } from "../apis/Userapi";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await getAllUsers();
        setUsers(res.result || res.users || []);
      } catch (e) {
        console.error("Failed to fetch users", e);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading) return <p>Loading users...</p>;

  return (
    <table className="admin-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Verified</th>
          <th>Admin</th>
        </tr>
      </thead>
      <tbody>
        {users.map((u) => (
          <tr key={u._id}>
            <td>{u.name}</td>
            <td>{u.email}</td>
            <td>{u.verified ? "✅" : "❌"}</td>
            <td>{u.isAdmin ? "🛠" : "-"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
