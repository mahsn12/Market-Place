import React, { useEffect, useState } from "react";
import {
  getAllOrders,
  updateOrderStatus,
} from "../apis/orderapi";

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await getAllOrders();
        setOrders(res?.result || []);
      } catch (e) {
        console.error("Failed to load orders", e);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId, status) => {
    try {
      const res = await updateOrderStatus(orderId, { status });

      // ✅ always trust backend response
      setOrders((prev) =>
        prev.map((o) =>
          o._id === orderId ? res.result : o
        )
      );
    } catch (e) {
      console.error(
        "Failed to update status:",
        e?.response?.data || e.message
      );
      alert(e?.response?.data?.message || "Status update failed");
    }
  };

  if (loading) {
    return <p>Loading orders...</p>;
  }

  if (!orders.length) {
    return <p>No orders found.</p>;
  }

  return (
    <table className="admin-table">
      <thead>
        <tr>
          <th>Order ID</th>
          <th>Buyer</th>
          <th>Total</th>
          <th>Status</th>
        </tr>
      </thead>

      <tbody>
        {orders.map((o) => (
          <tr key={o._id}>
            <td>{o._id.slice(-6)}</td>

            {/* ✅ correct populated field */}
            <td>{o.buyerId?.name || "—"}</td>

            {/* ✅ correct price field */}
            <td>${Number(o.totalPrice || 0).toFixed(2)}</td>

            <td>
              <select
                value={o.status}
                onChange={(e) =>
                  handleStatusChange(o._id, e.target.value)
                }
              >
                <option value="Pending">Pending</option>
                <option value="Shipped">Shipped</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
