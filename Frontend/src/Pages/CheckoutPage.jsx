import React, { useEffect, useState } from "react";
import PageLayout from "../components/PageLayout";
import "../Style/CheckoutPage.css";
import { createOrder } from "../apis/Orders";
import { useToast } from "../components/ToastContext";

export default function CheckoutPage({ user, onNavigate }) {
  const [cart, setCart] = useState([]);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [subtotal, setSubtotal] = useState(0);
  const { showSuccess, showError, showWarning } = useToast();
  const [shipping, setShipping] = useState(0);
  const [tax, setTax] = useState(0);
  const [total, setTotal] = useState(0);
  const [cardData, setCardData] = useState({
    cardNumber: "",
    cardName: "",
    expiration: "",
    cvv: "",
  });

  useEffect(() => {
    const savedCart = JSON.parse(localStorage.getItem("cart") || "[]");
    setCart(savedCart);
    calculateTotals(savedCart);
  }, []);

  const calculateTotals = (cartItems) => {
    const newSubtotal = cartItems.reduce(
      (sum, item) => sum + item.price * item.qty,
      0
    );
    const newShipping = newSubtotal > 0 ? 10 : 0;
    const newTax = newSubtotal * 0.1;
    const newTotal = newSubtotal + newShipping + newTax;

    setSubtotal(newSubtotal);
    setShipping(newShipping);
    setTax(newTax);
    setTotal(newTotal);
  };

  const handleQtyChange = (itemId, newQty) => {
    const updated = cart.map((item) =>
      item._id === itemId ? { ...item, qty: Math.max(1, newQty) } : item
    );
    setCart(updated);
    localStorage.setItem("cart", JSON.stringify(updated));
    calculateTotals(updated);
  };

  const handleQtyIncrease = (itemId) => {
    const item = cart.find((i) => i._id === itemId);
    if (item) {
      handleQtyChange(itemId, (item.qty || 1) + 1);
    }
  };

  const handleQtyDecrease = (itemId) => {
    const item = cart.find((i) => i._id === itemId);
    if (item && (item.qty || 1) > 1) {
      handleQtyChange(itemId, (item.qty || 1) - 1);
    }
  };

  const handleRemove = (itemId) => {
    const updated = cart.filter((item) => item._id !== itemId);
    setCart(updated);
    localStorage.setItem("cart", JSON.stringify(updated));
    calculateTotals(updated);
  };

  const placeOrder = async () => {
    if (!user?.id) {
      showWarning("Please log in to place an order");
      return;
    }

    try {
      setLoading(true);

      // Group cart items by seller
      const ordersBySeller = {};
      cart.forEach((item) => {
        const sellerId = item.sellerId?._id || item.sellerId || item.seller?.id;
        if (!sellerId) {
          console.error("Product missing sellerId:", item);
          return;
        }

        if (!ordersBySeller[sellerId]) {
          ordersBySeller[sellerId] = [];
        }
        ordersBySeller[sellerId].push({
          productId: item._id || item.id,
          quantity: item.qty || 1,
          price: item.price,
        });
      });

      // Create orders for each seller
      const orderPromises = Object.entries(ordersBySeller).map(
        async ([sellerId, products]) => {
          const orderData = {
            sellerId: sellerId,
            products: products,
          };

          return await createOrder(orderData);
        }
      );

      await Promise.all(orderPromises);

      showSuccess("Order(s) placed successfully!");
      setCart([]);
      setNote("");
      setCardData({ cardNumber: "", cardName: "", expiration: "", cvv: "" });
      localStorage.removeItem("cart");
      calculateTotals([]);
      onNavigate("orders"); // Redirect to orders page
    } catch (e) {
      console.error("Failed to place order:", e);
      const errorMessage =
        e.message ||
        e.error ||
        e.response?.data?.message ||
        "Failed to place order. Please try again.";
      showError(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToShopping = () => {
    console.log("Back to shopping clicked");

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
    <PageLayout title="Your Cart">
      <div className="checkout-content shopping-cart">
        <section className="checkout-items">
          <h2 className="checkout-heading">Your Products</h2>
          {cart.length === 0 ? (
            <div className="empty-checkout">
              <div className="empty-icon">🛍️</div>
              <h3>Your cart is empty</h3>
              <p>Add items from the marketplace to get started</p>
            </div>
          ) : (
            <div className="items-list">
              {cart.map((item) => (
                <div key={item.id} className="product-row-card">
                  <div className="product-image">
                    <img
                      src={item.images?.[0] || ""}
                      alt={item.name}
                      className="product-img"
                      style={{ display: item.images?.[0] ? "block" : "none" }}
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.nextSibling.style.display = "flex";
                      }}
                    />
                    <div
                      className="product-emoji"
                      style={{ display: item.images?.[0] ? "none" : "flex" }}
                    >
                      🛒
                    </div>
                  </div>
                  <div className="product-details">
                    <div className="product-header">
                      <div>
                        <h5 className="product-name">
                          {item.name || "Product"}
                        </h5>
                        <p className="product-color">
                          {item.seller || "Unknown Seller"}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemove(item._id)}
                        className="product-remove-btn"
                        title="Remove item"
                      >
                        ×
                      </button>
                    </div>
                    <div className="product-footer">
                      <p className="product-price">
                        ${(item.price || 0).toFixed(2)}
                      </p>
                      <div className="number-input">
                        <button
                          type="button"
                          className="minus"
                          onClick={() => handleQtyDecrease(item._id)}
                        ></button>
                        <input
                          type="number"
                          min="1"
                          value={item.qty || 1}
                          onChange={(e) =>
                            handleQtyChange(
                              item.id,
                              parseInt(e.target.value) || 1
                            )
                          }
                        />
                        <button
                          type="button"
                          className="plus"
                          onClick={() => handleQtyIncrease(item._id)}
                        ></button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {cart.length > 0 && (
            <div className="order-note-section">
              <label>Order notes (optional)</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add delivery instructions or special requests..."
              />
            </div>
          )}
        </section>

        <aside className="checkout-summary">
          <h3>Payment</h3>

          {cart.length > 0 && (
            <div className="order-totals">
              <div className="total-row">
                <span>Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="total-row">
                <span>Shipping:</span>
                <span>${shipping.toFixed(2)}</span>
              </div>
              <div className="total-row">
                <span>Tax (10%):</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="total-row total-final">
                <span>Total:</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          )}

          <form className="payment-form">
            <div className="form-group">
              <label>Card number</label>
              <input
                type="text"
                placeholder="1234 5678 9012 3457"
                maxLength="19"
                value={cardData.cardNumber}
                onChange={(e) =>
                  setCardData({ ...cardData, cardNumber: e.target.value })
                }
              />
            </div>

            <div className="form-group">
              <label>Name on card</label>
              <input
                type="text"
                placeholder="John Smith"
                value={cardData.cardName}
                onChange={(e) =>
                  setCardData({ ...cardData, cardName: e.target.value })
                }
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Expiration</label>
                <input
                  type="text"
                  placeholder="MM/YYYY"
                  maxLength="7"
                  value={cardData.expiration}
                  onChange={(e) =>
                    setCardData({ ...cardData, expiration: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label>CVV</label>
                <input
                  type="text"
                  placeholder="•••"
                  maxLength="3"
                  value={cardData.cvv}
                  onChange={(e) =>
                    setCardData({ ...cardData, cvv: e.target.value })
                  }
                />
              </div>
            </div>

            <p className="form-disclaimer">
              By completing this purchase, you agree to our terms and
              conditions.
            </p>

            <button
              type="button"
              onClick={placeOrder}
              disabled={cart.length === 0 || loading}
              className="btn-primary"
            >
              {loading ? "Processing..." : "Buy Now"}
            </button>

            {/* FIXED: Change link to button */}
            <div className="back-to-shopping">
              <button
                className="back-to-shopping-btn"
                onClick={handleBackToShopping}
              >
                ← Back to shopping
              </button>
            </div>
          </form>
        </aside>
      </div>
    </PageLayout>
  );
}
