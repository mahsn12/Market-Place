import React from "react";
import "../Style/ProductRow.css";

export default function ProductRow({ item, onQtyChange, onRemove }) {
  return (
    <div className="product-row">
      <div className="product-info">
        <h3 className="product-name">{item.name || "Product Name"}</h3>
        <p className="product-price">
          Price: ${item.price?.toFixed(2) || "0.00"}
        </p>
      </div>

      <div className="product-controls">
        <div className="qty-control">
          <label>Qty:</label>
          <input
            type="number"
            min="1"
            value={item.qty || 1}
            onChange={(e) => onQtyChange(item.id, parseInt(e.target.value))}
          />
        </div>

        <div className="product-total">
          ${((item.price || 0) * (item.qty || 1)).toFixed(2)}
        </div>

        <button onClick={() => onRemove(item.id)} className="btn-danger">
          Remove
        </button>
      </div>
    </div>
  );
}
