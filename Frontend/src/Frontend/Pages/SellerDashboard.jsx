import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import '../Style/SellerDashboard.css';

export default function SellerDashboard() {
  const [orders, setOrders] = useState([]);
  const [metrics, setMetrics] = useState({ revenue: 0, orders: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = mockSellerData();
        setOrders(data.orders);
        setMetrics(data.metrics);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const mockSellerData = () => {
    return {
      metrics: { revenue: 1250.5, orders: 28 },
      orders: [
        { _id: 'o_1', status: 'Processing', createdAt: Date.now() - 1000 * 60 * 60, items: [{ title: 'Hat' }], total: 19.5 },
        { _id: 'o_2', status: 'Shipped', createdAt: Date.now() - 1000 * 60 * 60 * 24, items: [{ title: 'Socks' }], total: 9.99 }
      ]
    };
  };

  const updateStatus = async (orderId, status) => {
    try {
      setOrders(o => o.map(x => x._id === orderId ? { ...x, status } : x));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="seller-dashboard-page">
      <Navbar />
      <main className="seller-dashboard-main">
        <h2>Seller dashboard</h2>

        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-label">Revenue</div>
            <div className="metric-value">${metrics.revenue?.toFixed(2) || '0.00'}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Orders</div>
            <div className="metric-value">{metrics.orders || 0}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Pending</div>
            <div className="metric-value">{orders.filter(o => o.status === 'Processing').length}</div>
          </div>
        </div>

        <section className="orders-section">
          <h3>Recent orders</h3>
          {loading ? (
            <div>Loading...</div>
          ) : (
            <div className="orders-container">
              {orders.map(o => (
                <div key={o._id} className="order-row">
                  <div className="order-info">
                    <div className="order-id">{o._id}</div>
                    <div className="order-items">{o.items?.map(i => i.title).join(', ') || 'No items'}</div>
                  </div>
                  <div className="order-actions">
                    <div className="order-total">${o.total?.toFixed(2) || '0.00'}</div>
                    <select value={o.status} onChange={(e) => updateStatus(o._id, e.target.value)} className="status-select">
                      <option>Processing</option>
                      <option>Shipped</option>
                      <option>Delivered</option>
                      <option>Cancelled</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}

