import React, { useEffect, useState } from "react";
import { getOrdersByBuyer } from "../apis/orderapi";

export default function OrdersPage({ user, onNavigate }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const res = await getOrdersByBuyer(user._id || user.id);
        setOrders(res.result || []);
      } catch (err) {
        setError(err.message || "Failed to load orders");
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchOrders();
  }, [user]);

  if (loading) return <div>Loading orders...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="orders-page">
      <h2>Your Orders</h2>
      {orders.length === 0 && <p>You have no orders yet.</p>}
      <ul className="orders-list">
        {orders.map((o) => (
          <li key={o._id} className="order-item">
            <div>
              <strong>Order:</strong> {o._id}
            </div>
            <div>
              <strong>Date:</strong> {new Date(o.orderDate).toLocaleString()}
            </div>
            <div>
              <strong>Total:</strong> ${o.totalPrice?.toFixed?.(2) ?? o.totalPrice}
            </div>
            <div>
              <strong>Status:</strong> {o.status}
            </div>
            <div>
              <strong>Items:</strong> {o.items?.length || 0}
            </div>
            <div>
              <button
                onClick={() => onNavigate("order-details", { order: o })}
                className="btn-primary"
              >
                View Details
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
