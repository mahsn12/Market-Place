import React, { useEffect, useState } from 'react';
import PageLayout from '../components/PageLayout';
import '../Style/OrdersPage.css';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    try {
      const savedOrders = JSON.parse(localStorage.getItem('orders') || '[]');
      // Sort by newest first
      const sorted = savedOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setOrders(sorted);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Processing': return '#ff9800';
      case 'Shipped': return '#2196f3';
      case 'Delivered': return '#4caf50';
      case 'Cancelled': return '#f44336';
      default: return '#999';
    }
  };

  return (
    <PageLayout title="Your Orders">
      <div className="orders-main">
        {loading ? (
          <div className="loading">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <h3>No orders yet</h3>
            <p>Start shopping to place your first order!</p>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map(order => (
              <div 
                key={order._id} 
                className={`order-card ${selected?._id === order._id ? 'active' : ''}`}
                onClick={() => setSelected(selected?._id === order._id ? null : order)}
              >
                <div className="order-card-header">
                  <div className="order-id-date">
                    <div className="order-id">{order._id}</div>
                    <div className="order-date">{formatDate(order.createdAt)}</div>
                  </div>
                  <div className="order-status" style={{ color: getStatusColor(order.status) }}>
                    {order.status}
                  </div>
                </div>
                <div className="order-card-body">
                  <div className="order-items-preview">
                    {order.items?.slice(0, 2).map((item, idx) => (
                      <span key={idx} className="item-preview">{item.name}</span>
                    ))}
                    {order.items?.length > 2 && <span className="item-preview">+{order.items.length - 2} more</span>}
                  </div>
                  <div className="order-total">${order.total?.toFixed(2) || '0.00'}</div>
                </div>

                {selected?._id === order._id && (
                  <div className="order-expanded">
                    <div className="order-details-section">
                      <h4>Order Details</h4>
                      <div className="detail-row">
                        <span>Order ID:</span>
                        <span className="detail-value">{order._id}</span>
                      </div>
                      <div className="detail-row">
                        <span>Status:</span>
                        <span className="detail-value" style={{ color: getStatusColor(order.status), fontWeight: 600 }}>
                          {order.status}
                        </span>
                      </div>
                      <div className="detail-row">
                        <span>Placed:</span>
                        <span className="detail-value">{formatDate(order.createdAt)}</span>
                      </div>
                    </div>

                    <div className="order-items-section">
                      <h4>Items</h4>
                      <div className="items-table">
                        {order.items?.map((item, idx) => (
                          <div key={idx} className="item-row">
                            <span className="item-name">{item.name}</span>
                            <span className="item-qty">x{item.qty}</span>
                            <span className="item-price">${(item.price * item.qty).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="order-summary-section">
                      <h4>Order Summary</h4>
                      <div className="summary-row">
                        <span>Subtotal:</span>
                        <span>${order.subtotal?.toFixed(2) || '0.00'}</span>
                      </div>
                      <div className="summary-row">
                        <span>Shipping:</span>
                        <span>${order.shipping?.toFixed(2) || '0.00'}</span>
                      </div>
                      <div className="summary-row">
                        <span>Tax:</span>
                        <span>${order.tax?.toFixed(2) || '0.00'}</span>
                      </div>
                      <div className="summary-row total">
                        <span>Total:</span>
                        <span>${order.total?.toFixed(2) || '0.00'}</span>
                      </div>
                    </div>

                    {order.note && (
                      <div className="order-note-section">
                        <h4>Delivery Notes</h4>
                        <p>{order.note}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
}

