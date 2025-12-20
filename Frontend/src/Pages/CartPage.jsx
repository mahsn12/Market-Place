import React, { useEffect, useState } from "react";
import "../Style/HomePage.css";
import { getCart, addToCart, removeFromCart } from "../apis/Userapi";
import { useToast } from "../components/ToastContext";

export default function CartPage({ onNavigate, isLoggedIn }) {
  const { showError } = useToast();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) return;

    const fetchCart = async () => {
      try {
        const response = await getCart();
        setCart(response.cart || []);
      } catch {
        showError("Failed to load cart");
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, [isLoggedIn]);

  const handleIncrease = async (item) => {
    if (item.cartQuantity >= item.availableQuantity) return;

    try {
      await addToCart({ postId: item.postId, quantity: 1 });

      setCart((prev) =>
        prev.map((i) =>
          i.postId === item.postId
            ? { ...i, cartQuantity: i.cartQuantity + 1 }
            : i
        )
      );
    } catch {
      showError("Failed to increase quantity");
    }
  };

  const handleDecrease = async (item) => {
    try {
      await removeFromCart({ postId: item.postId, quantity: 1 });

      setCart((prev) =>
        prev
          .map((i) =>
            i.postId === item.postId
              ? { ...i, cartQuantity: i.cartQuantity - 1 }
              : i
          )
          .filter((i) => i.cartQuantity > 0)
      );
    } catch {
      showError("Failed to decrease quantity");
    }
  };

  const totalPrice = cart.reduce(
    (sum, item) => sum + item.price * item.cartQuantity,
    0
  );

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
      <div className="products-header">
        <h2>🛒 Your Cart</h2>
        <span className="product-count">{cart.length} items</span>
      </div>

      <div className="products-grid">
        {cart.map((item) => (
          <div
            key={item.postId}
            className="product-card"
            style={{ cursor: "pointer" }}
            onClick={() =>
              onNavigate("post-details", {
                       post: item.post || item,
                   })

            }
          >
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
                <span>In stock: {item.availableQuantity}</span>
              </div>

              {/* Quantity controls */}
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  alignItems: "center",
                  marginTop: "10px",
                }}
              >
                <button
                  className="btn-secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDecrease(item);
                  }}
                >
                  −
                </button>

                <span>{item.cartQuantity}</span>

                {item.cartQuantity < item.availableQuantity && (
                  <button
                    className="btn-secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleIncrease(item);
                    }}
                  >
                    +
                  </button>
                )}
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

      <div className="seller-cta" style={{ marginTop: "3rem" }}>
        <h2>Total: ${totalPrice.toFixed(2)}</h2>
              <button
                className="btn-primary btn-lg"
                onClick={() => onNavigate("checkout")}
              >
                Convert Cart to Order
              </button>

      </div>
    </div>
  );
}
