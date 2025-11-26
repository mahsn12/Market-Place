import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import '../Style/OrdersPage.css';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load orders from localStorage or API
    setLoading(true);
    try {
      const savedOrders = JSON.parse(localStorage.getItem('orders') || '[]');
      setOrders(savedOrders);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="orders-page">
      <Navbar />
      <main className="orders-main">
        <h2>Your orders</h2>
        {loading ? (
          <div className="loading">Loading...</div>
        ) : orders.length === 0 ? (
          <div className="empty-state">You have no orders yet.</div>
        ) : (
          <div className="orders-list">
            {orders.map(o => (
              <div key={o._id} className="order-card" onClick={() => setSelected(o)}>
                <div className="order-id">Order {o._id}</div>
                <div className="order-status">Status: {o.status}</div>
                <div className="order-total">Total: ${o.total?.toFixed(2) || '0.00'}</div>
              </div>
            ))}
          </div>
        )}

        {selected && (
          <div className="order-details">
            <h3>Order {selected._id}</h3>
            <div className="order-status">Status: {selected.status}</div>
            <div className="order-total">Total: ${selected.total?.toFixed(2) || '0.00'}</div>
            <button onClick={() => setSelected(null)} className="btn-secondary">Close</button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

