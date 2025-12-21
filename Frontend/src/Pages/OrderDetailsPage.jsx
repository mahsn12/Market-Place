import React, { useEffect, useState } from "react";

export default function OrderDetailsPage({ order: initialOrder, onNavigate }) {
  const [order, setOrder] = useState(initialOrder || null);
  const [loading, setLoading] = useState(!initialOrder);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      if (order) return;
      try {
        setLoading(true);
        setError("Order not provided and automatic fetch not implemented");
      } catch (err) {
        setError(err.message || "Failed to load order");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [order]);

  if (loading) return <div>Loading order...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!order) return <div>No order data available</div>;

  return (
    <div className="order-details">
      <h2>Order Details</h2>
      <div>
        <strong>Order ID:</strong> {order._id}
      </div>
      <div>
        <strong>Date:</strong> {new Date(order.orderDate).toLocaleString()}
      </div>
      <div>
        <strong>Status:</strong> {order.status}
      </div>
      <div>
        <strong>Total:</strong> ${order.totalPrice?.toFixed?.(2) ?? order.totalPrice}
      </div>

      <h3>Items</h3>
      <ul>
        {order.items.map((it) => (
          <li key={it.postId._id || it.postId}>
            {it.postId?.title || it.postId} — Qty: {it.quantity} — ${it.price?.toFixed?.(2) ?? it.price}
          </li>
        ))}
      </ul>

      <h3>Shipping Address</h3>
      <div>{order.shippingAddress?.fullName}</div>
      <div>{order.shippingAddress?.phone}</div>
      <div>
        {order.shippingAddress?.street}, {order.shippingAddress?.city}
      </div>

      <button onClick={() => onNavigate("orders")}>Back to orders</button>
    </div>
  );
}
