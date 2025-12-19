import React, { useEffect, useState } from "react";
import "../Style/HomePage.css"; // ✅ reuse existing styles
import { getCart } from "../apis/Userapi";
import { useToast } from "../components/ToastContext";

export default function CartPage({ onNavigate, isLoggedIn }) {
  const { showError, showSuccess } = useToast();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) return;

    const fetchCart = async () => {
      try {
        const response = await getCart();
        setCart(response.cart || []);
      } catch (error) {
        showError("Failed to load cart");
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, [isLoggedIn]);

  const totalPrice = cart.reduce(
    (sum, item) => sum + (item.price || 0) * item.cartQuantity,
    0
  );

  const handleConvertToOrder = () => {
    if (cart.length === 0) {
      showError("Your cart is empty");
      return;
    }

    // 🔥 later this will hit backend order creation
    showSuccess("Cart converted to order (placeholder)");
  };

  if (loading) {
    return (
      <div className="products-section">
        <div className="empty-state">
          <div className="empty-icon">⏳</div>
          <h3>Loading your cart...</h3>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="products-section">
        <div className="empty-state">
          <div className="empty-icon">🛒</div>
          <h3>Your cart is empty</h3>
          <p>Add some products to continue shopping</p>
          <button
            className="btn-primary btn-lg"
            onClick={() => onNavigate("home")}
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="products-section">
      {/* Header */}
      <div className="products-header">
        <h2>🛒 Your Cart</h2>
        <span className="product-count">
          {cart.length} item{cart.length > 1 ? "s" : ""}
        </span>
      </div>

      {/* Cart Grid */}
      <div className="products-grid">
        {cart.map((item) => (
          <div key={item.postId} className="product-card">
            <div className="product-image">
              {item.images?.[0] ? (
                <img
                  src={item.images[0]}
                  alt={item.title}
                  className="product-img"
                />
              ) : (
                <div className="product-emoji">📦</div>
              )}
            </div>

            <div className="product-content">
              <h3 className="product-name">{item.title}</h3>

              <div className="product-meta">
                <span className="seller">Qty: {item.cartQuantity}</span>
                <span className="rating">
                  In stock: {item.availableQuantity}
                </span>
              </div>

              <div className="product-footer">
                <span className="price">
                  ${(item.price * item.cartQuantity).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Cart Summary */}
      <div
        className="seller-cta"
        style={{ marginTop: "3rem", textAlign: "center" }}
      >
        <div className="seller-cta-content">
          <h2>Total: ${totalPrice.toFixed(2)}</h2>
          <p>Ready to place your order?</p>

          <button
            className="btn-primary btn-lg"
            onClick={handleConvertToOrder}
          >
            Convert Cart to Order
          </button>
        </div>
      </div>
    </div>
  );
}
