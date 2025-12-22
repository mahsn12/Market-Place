import React, { useState } from "react";
import AdminUsers from "./AdminUsers";
import AdminOrders from "./AdminOrders";
import "../Style/AdminPage.css";

export default function AdminPage({ user, onNavigate }) {
  const [activeTab, setActiveTab] = useState("users");

  return (
    <div className="admin-page">
      <h1>🛠 Admin Panel</h1>

      <div className="admin-tabs">
        <button
          className={activeTab === "users" ? "active" : ""}
          onClick={() => setActiveTab("users")}
        >
          👥 Users
        </button>

        <button
          className={activeTab === "orders" ? "active" : ""}
          onClick={() => setActiveTab("orders")}
        >
          📦 Orders
        </button>
      </div>

      <div className="admin-content">
        {activeTab === "users" && <AdminUsers />}
        {activeTab === "orders" && <AdminOrders />}
      </div>
    </div>
  );
}
