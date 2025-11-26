import React, { useEffect, useState } from 'react';
import PageLayout from '../components/PageLayout';
import '../Style/SellerDashboard.css';

export default function SellerDashboard() {
  const [orders, setOrders] = useState([]);
  const [metrics, setMetrics] = useState({ revenue: 0, orders: 0, pending: 0 });
  const [loading, setLoading] = useState(false);

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  useEffect(() => {
    loadSellerData();
  }, []);

  const loadSellerData = () => {
    setLoading(true);
    try {
      const storedOrders = JSON.parse(localStorage.getItem('orders') || '[]');
      
      // Calculate metrics from real orders
      const totalRevenue = storedOrders.reduce((sum, order) => sum + (order.total || 0), 0);
      const processingCount = storedOrders.filter(o => o.status === 'Processing').length;
      
      setOrders(storedOrders);
      setMetrics({
        revenue: totalRevenue,
        orders: storedOrders.length,
        pending: processingCount
      });
    } catch (e) {
      console.error('Error loading seller data:', e);
      setOrders([]);
      setMetrics({ revenue: 0, orders: 0, pending: 0 });
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId, newStatus) => {
    try {
      const updatedOrders = orders.map(order => 
        order._id === orderId ? { ...order, status: newStatus } : order
      );
      setOrders(updatedOrders);
      localStorage.setItem('orders', JSON.stringify(updatedOrders));
    } catch (e) {
      console.error('Error updating order status:', e);
    }
  };

  return (
    <PageLayout title="Seller Dashboard">
      <div className="seller-dashboard-content">

        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-label">Revenue</div>
            <div className="metric-value">${metrics.revenue?.toFixed(2) || '0.00'}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Total Orders</div>
            <div className="metric-value">{metrics.orders || 0}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Processing</div>
            <div className="metric-value">{metrics.pending || 0}</div>
          </div>
        </div>

        <section className="orders-section">
          <h3>Recent Orders</h3>
          {loading ? (
            <div>Loading...</div>
          ) : orders.length === 0 ? (
            <div className="empty-orders">
              <p>No orders yet. Start selling to see orders here!</p>
            </div>
          ) : (
            <div className="orders-container">
              {orders.slice().reverse().map(order => (
                <div key={order._id} className="order-row">
                  <div className="order-info">
                    <div className="order-id">{order._id}</div>
                    <div className="order-items">
                      {order.items?.length > 0 
                        ? `${order.items.length} item${order.items.length !== 1 ? 's' : ''}: ${order.items.map(i => i.name || i.title || 'Product').join(', ')}` 
                        : 'No items'}
                    </div>
                    <div className="order-date">{formatDate(order.createdAt)}</div>
                  </div>
                  <div className="order-actions">
                    <div className="order-total">${order.total?.toFixed(2) || '0.00'}</div>
                    <select value={order.status} onChange={(e) => updateStatus(order._id, e.target.value)} className="status-select">
                      <option value="Processing">Processing</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </PageLayout>
  );
}

