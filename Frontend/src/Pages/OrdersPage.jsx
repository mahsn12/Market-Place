import React, { useEffect, useState } from "react";
import "../Style/HomePage.css";
import {
  getOrdersByBuyer,
  getOrdersBySeller,
} from "../apis/orderapi";

export default function OrdersPage({ user, onNavigate }) {
  const [activeTab, setActiveTab] = useState("buying"); // buying | selling
  const [buyOrders, setBuyOrders] = useState([]);
  const [sellOrders, setSellOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /* ---------------- FETCH BUY ORDERS ---------------- */
  useEffect(() => {
    if (!user || activeTab !== "buying") return;

    const fetchBuyOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await getOrdersByBuyer(user._id || user.id);
        setBuyOrders(res.result || []);
      } catch (err) {
        setError(err.message || "Failed to load your orders");
      } finally {
        setLoading(false);
      }
    };

    fetchBuyOrders();
  }, [user, activeTab]);

  /* ---------------- FETCH SELL ORDERS ---------------- */
  useEffect(() => {
    if (!user || activeTab !== "selling") return;

    const fetchSellOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await getOrdersBySeller(user._id || user.id);
        setSellOrders(res.result || []);
      } catch (err) {
        setError(err.message || "Failed to load listing orders");
      } finally {
        setLoading(false);
      }
    };

    fetchSellOrders();
  }, [user, activeTab]);

  const orders = activeTab === "buying" ? buyOrders : sellOrders;

  /* ---------------- LOADING ---------------- */
  if (loading) {
    return (
      <div className="products-section">
        <div className="empty-state">
          <div className="empty-icon">⏳</div>
          <h3>Loading orders...</h3>
        </div>
      </div>
    );
  }

  /* ---------------- ERROR ---------------- */
  if (error) {
    return (
      <div className="products-section">
        <div className="empty-state">
          <div className="empty-icon">❌</div>
          <h3>{error}</h3>
        </div>
      </div>
    );
  }

  /* ---------------- UI ---------------- */
  return (
    <div className="products-section">
      {/* ---------- HEADER ---------- */}
      <div className="products-header">
        <h2>📦 Orders</h2>
        <span className="product-count">
          {orders.length} orders
        </span>
      </div>

      {/* ---------- TABS ---------- */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "1.5rem",
        }}
      >
        <button
          className={
            activeTab === "buying"
              ? "btn-primary"
              : "btn-secondary"
          }
          onClick={() => setActiveTab("buying")}
        >
          🛒 My Orders
        </button>

        <button
          className={
            activeTab === "selling"
              ? "btn-primary"
              : "btn-secondary"
          }
          onClick={() => setActiveTab("selling")}
        >
          🏷️ Orders on My Listings
        </button>
      </div>

      {/* ---------- EMPTY ---------- */}
      {orders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <h3>
            {activeTab === "buying"
              ? "You haven't bought anything yet"
              : "No one has bought from you yet"}
          </h3>
          {activeTab === "buying" && (
            <button
              className="btn-primary btn-lg"
              onClick={() => onNavigate("home")}
            >
              Start Shopping
            </button>
          )}
        </div>
      ) : (
        <div className="products-grid">
          {orders.map((order) => (
            <div
              key={order._id}
              className="product-card"
              style={{ cursor: "pointer" }}
              onClick={() =>
                onNavigate("order-details", {
                  order,
                  mode: activeTab, // useful later
                })
              }
            >
              <div className="product-image">
                {order.items?.[0]?.images?.[0] ? (
                  <img
                    src={order.items[0].images[0]}
                    alt="Order item"
                    className="product-img"
                  />
                ) : (
                  <div className="product-emoji">📦</div>
                )}
              </div>

              <div className="product-content">
                <h3 className="product-name">
                  Order #{order._id.slice(-6)}
                </h3>

                <div className="product-meta">
                  <span>
                    {new Date(order.orderDate).toLocaleDateString()}
                  </span>
                  <span>Status: {order.status}</span>
                </div>

                <div style={{ marginTop: "10px" }}>
                  <strong>Items:</strong>{" "}
                  {order.items?.length || 0}
                </div>

                <div className="product-footer">
                  <span className="price">
                    $
                    {order.totalPrice?.toFixed?.(2) ??
                      order.totalPrice}
                  </span>

                  <button
                    className="btn-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigate("order-details", {
                        order,
                        mode: activeTab,
                      });
                    }}
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
