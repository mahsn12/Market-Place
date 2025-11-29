import React, { useState } from "react";
import '../Style/PageLayout.css';
import '../Style/ProductForm.css';

export default function ProductForm({ onNavigate }) {
  const [form, setForm] = useState({
    name: "",
    price: "",
    category: "",
    image: "",
    description: "",
  });

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit(e) {
    e.preventDefault();
    alert("Product added (mock)!");
    onNavigate("sellerDashboard");
  }

  return (
    <div className="page-container form-page">

      <button className="back-btn" onClick={() => onNavigate("sellerDashboard")}>
        ← Back
      </button>

      <form className="form-card" onSubmit={handleSubmit}>
        <h2>Add New Product</h2>

        <input name="name" placeholder="Product Name" onChange={handleChange} required />
        <input name="price" type="number" placeholder="Price" onChange={handleChange} required />
        <input name="category" placeholder="Category (electronics, fashion...)" onChange={handleChange} />
        <input name="image" placeholder="Emoji Image (ex: 🎧)" onChange={handleChange} />
        
        <textarea
          name="description"
          placeholder="Product Description"
          onChange={handleChange}
        />

        <button className="btn-primary" type="submit">
          Add Product
        </button>
      </form>
    </div>
  );
}
