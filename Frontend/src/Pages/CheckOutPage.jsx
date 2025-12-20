import React, { useState } from "react";
import "../Style/HomePage.css";
import { useToast } from "../components/ToastContext";
import { convertCartToOrders } from "../apis/orderapi";

export default function CheckoutPage({ onNavigate }) {
  const { showError, showSuccess } = useToast();
  const [loading, setLoading] = useState(false);

  const [shippingAddress, setShippingAddress] = useState({
    fullName: "",
    phone: "",
    street: "",
    city: "",
    notes: "",
  });

  const handleChange = (e) => {
    setShippingAddress((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const validate = () => {
    if (
      !shippingAddress.fullName ||
      !shippingAddress.phone ||
      !shippingAddress.street ||
      !shippingAddress.city
    ) {
      showError("Please fill all required address fields");
      return false;
    }
    return true;
  };

  const handlePlaceOrder = async () => {
    if (!validate()) return;

    try {
      setLoading(true);

      await convertCartToOrders(shippingAddress);

      showSuccess("Order placed successfully!");
      onNavigate("home"); // later → "orders"
    } catch (err) {
      console.error(err);
      showError(err?.message || "Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="products-section">
      <div className="products-header">
        <h2>📦 Checkout</h2>
        <span className="product-count">Shipping Details</span>
      </div>

      <div
        className="product-card"
        style={{ maxWidth: "500px", margin: "0 auto", padding: "20px" }}
      >
        <div className="form-group">
          <label>Full Name *</label>
          <input
            type="text"
            name="fullName"
            value={shippingAddress.fullName}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Phone *</label>
          <input
            type="text"
            name="phone"
            value={shippingAddress.phone}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Street *</label>
          <input
            type="text"
            name="street"
            value={shippingAddress.street}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>City *</label>
          <input
            type="text"
            name="city"
            value={shippingAddress.city}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Notes (optional)</label>
          <textarea
            name="notes"
            value={shippingAddress.notes}
            onChange={handleChange}
            rows="3"
          />
        </div>

        <div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
          <button
            className="btn-secondary btn-lg"
            onClick={() => onNavigate("cart")}
            disabled={loading}
          >
            Back to Cart
          </button>

          <button
            className="btn-primary btn-lg"
            onClick={handlePlaceOrder}
            disabled={loading}
          >
            {loading ? "Placing Order..." : "Place Order"}
          </button>
        </div>
      </div>
    </div>
  );
}
