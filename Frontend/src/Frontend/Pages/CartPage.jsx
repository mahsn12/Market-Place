import React, { useState } from "react";
import ProductRow from "../components/ProductRow";
import "../Style/PageLayout.css";
import "../Style/CartPage.css";

export default function CartPage({ cart, updateQty, removeItem, onNavigate }) {
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  return (
    <div className="page-container cart-page">
      <h1>Your Cart</h1>

      <button className="back-btn" onClick={() => onNavigate("home")}>← Back</button>

      <div className="cart-list">
        {cart.length === 0 ? (
          <p className="empty-text">Your cart is empty</p>
        ) : (
          cart.map(item => (
            <ProductRow
              key={item.id}
              item={item}
              onQtyChange={(qty) => updateQty(item.id, qty)}
              onRemove={removeItem}
            />
          ))
        )}
      </div>

      {cart.length > 0 && (
        <div className="cart-summary">
          <h2>Total: ${total.toFixed(2)}</h2>

          <button
            className="btn-primary"
            onClick={() => onNavigate("checkout")}
          >
            Proceed to Checkout
          </button>
        </div>
      )}
    </div>
  );
}
