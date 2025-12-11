import React, { useEffect, useState } from "react";
import PageLayout from "../components/PageLayout";
import "../Style/OrdersPage.css";
import { getOrdersByBuyer, getOrdersBySeller } from "../apis/Orders";

export default function OrdersPage({ user, onNavigate }) {
  // ADD onNavigate prop
  const [orders, setOrders] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState("buyer"); // 'buyer' or 'seller'

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user?.id) return;

      setLoading(true);
      try {
        let response;
        if (view === "buyer") {
          response = await getOrdersByBuyer(user.id);
        } else {
          response = await getOrdersBySeller(user.id);
        }
        const fetchedOrders = response.result || [];
        // Sort by newest first
        const sorted = fetchedOrders.sort(
          (a, b) =>
            new Date(b.orderDate || b.createdAt) -
            new Date(a.orderDate || a.createdAt)
        );
        setOrders(sorted);
      } catch (e) {
        console.error("Failed to fetch orders:", e);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user, view]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Processing":
        return "#ff9800";
      case "Shipped":
        return "#2196f3";
      case "Delivered":
        return "#4caf50";
      case "Cancelled":
        return "#f44336";
      default:
        return "#999";
    }
  };

  const handleBackToShopping = () => {
    console.log("Back to shopping clicked from OrdersPage");

    // Method 1: Use onNavigate prop if available
    if (onNavigate && typeof onNavigate === "function") {
      console.log("Using onNavigate prop");
      onNavigate("home");
    }
    // Method 2: Direct approach (fallback)
    else {
      console.log("Using fallback method");
      localStorage.setItem("CurrentPage", "home");
      window.location.reload();
    }
  };

  return (
    <PageLayout title="Your Orders">
      <div className="orders-main">
        <div className="orders-tabs">
          <button
            className={`tab-btn ${view === "buyer" ? "active" : ""}`}
            onClick={() => setView("buyer")}
          >
            My Purchases
          </button>
          <button
            className={`tab-btn ${view === "seller" ? "active" : ""}`}
            onClick={() => setView("seller")}
          >
            My Sales
          </button>
        </div>

        {loading ? (
          <div className="loading">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <h3>No orders yet</h3>
            <p>Start shopping to place your first order!</p>
            {/* Add another back button in empty state */}
            <div className="back-to-shopping" style={{ marginTop: "20px" }}>
              <button
                className="back-to-shopping-btn"
                onClick={handleBackToShopping}
              >
                ← Back to shopping
              </button>
            </div>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((order) => (
              <div
                key={order._id}
                className={`order-card ${
                  selected?._id === order._id ? "active" : ""
                }`}
                onClick={() =>
                  setSelected(selected?._id === order._id ? null : order)
                }
              >
                <div className="order-card-header">
                  <div className="order-id-date">
                    <div className="order-id">Order #{order._id.slice(-8)}</div>
                    <div className="order-date">
                      {formatDate(order.orderDate)}
                    </div>
                  </div>
                  <div
                    className="order-status"
                    style={{ color: getStatusColor(order.status) }}
                  >
                    {order.status}
                  </div>
                </div>
                <div className="order-card-body">
                  <div className="order-items-preview">
                    {order.products?.slice(0, 2).map((item, idx) => (
                      <span key={idx} className="item-preview">
                        {item.productId?.name || "Product"} x{item.quantity}
                      </span>
                    ))}
                    {order.products?.length > 2 && (
                      <span className="item-preview">
                        +{order.products.length - 2} more
                      </span>
                    )}
                  </div>
                  <div className="order-total">
                    Total: ${order.totalPrice?.toFixed(2)}
                  </div>
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
                        <span
                          className="detail-value"
                          style={{
                            color: getStatusColor(order.status),
                            fontWeight: 600,
                          }}
                        >
                          {order.status}
                        </span>
                      </div>
                      <div className="detail-row">
                        <span>Placed:</span>
                        <span className="detail-value">
                          {formatDate(order.orderDate)}
                        </span>
                      </div>
                      {view === "buyer" && order.sellerId && (
                        <div className="detail-row">
                          <span>Seller:</span>
                          <span className="detail-value">
                            {order.sellerId.name}
                          </span>
                        </div>
                      )}
                      {view === "seller" && order.buyerId && (
                        <div className="detail-row">
                          <span>Buyer:</span>
                          <span className="detail-value">
                            {order.buyerId.name}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="order-items-section">
                      <h4>Items</h4>
                      <div className="items-table">
                        {order.products?.map((item, idx) => (
                          <div key={idx} className="item-row">
                            <span className="item-name">
                              {item.productId?.name || "Product"}
                            </span>
                            <span className="item-qty">x{item.quantity}</span>
                            <span className="item-price">
                              ${(item.price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="order-summary-section">
                      <h4>Order Summary</h4>
                      <div className="summary-row total">
                        <span>Total:</span>
                        <span>${order.totalPrice?.toFixed(2)}</span>
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
