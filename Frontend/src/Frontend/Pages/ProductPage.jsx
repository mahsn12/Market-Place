import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../Style/ProductPage.css";

const API_BASE = "http://localhost:5200/api";

export default function ProductPage({ user, isLoggedIn, onStartShopping }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [recommended, setRecommended] = useState([]);
  const [newReview, setNewReview] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Helper: Get token from localStorage (or wherever you store it)
  const getAuthHeaders = () => {
    const token = localStorage.getItem("token") || localStorage.getItem("authToken");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Fetch product
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`${API_BASE}/products/${id}`);
        const data = await res.json();

        if (!data.result) {
          setError(true);
          setLoading(false);
          return;
        }

        setProduct(data.result);

        // Fetch recommended
        if (data.result.category) {
          const recRes = await fetch(
            `${API_BASE}/products?category=${data.result.category}&limit=6`
          );
          const recData = await recRes.json();
          setRecommended(
            (recData.result || []).filter((p) => p._id !== id).slice(0, 6)
          );
        }
      } catch (err) {
        console.error(err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProduct();
  }, [id]);

  // ADD TO CART
  const addToCart = () => {
    if (!isLoggedIn) {
      onStartShopping?.();
      return;
    }
    if (user?.userType !== "buyer") {
      alert("Sellers cannot buy items.");
      return;
    }

    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const existing = cart.find((item) => item._id === product._id);
    if (existing) existing.qty += 1;
    else cart.push({ ...product, qty: 1 });

    localStorage.setItem("cart", JSON.stringify(cart));
    alert(`${product.name} added to cart!`);
    navigate("/checkout");
  };

  // SUBMIT REVIEW — NOW WITH AUTH TOKEN!
  const submitReview = async () => {
    if (!isLoggedIn || user?.userType !== "buyer") {
      alert("Please log in as a buyer to leave a review.");
      return;
    }
    if (!newReview.trim()) {
      alert("Review cannot be empty.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/products/${id}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(), // THIS IS THE KEY FIX!
        },
        body: JSON.stringify({
          comment: newReview,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setProduct(data.result); // update product with new review
        setNewReview("");
        alert("Thank you! Your review was posted.");
      } else {
        const error = await response.json();
        alert(error.message || "Failed to post review");
      }
    } catch (err) {
      console.error(err);
      alert("Network error. Please try again.");
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error || !product) return <div className="error">Product not found</div>;

  return (
    <div className="product-page">
      {/* Main Product */}
      <div className="product-container">
        <div className="product-images">
          {product.images?.[0] ? (
            <img src={product.images[0]} alt={product.name} loading="lazy" />
          ) : (
            <div className="placeholder-img">No Image</div>
          )}
        </div>

        <div className="product-details">
          <h1 className="product-title">{product.name}</h1>
          <p className="product-description">{product.description || "No description."}</p>

          <div className="product-info">
            <p><strong>Seller:</strong> {product.sellerId?.name || "Unknown"}</p>
            <p><strong>Category:</strong> {product.category}</p>
            <p><strong>Condition:</strong> {product.condition || "New"}</p>
          </div>

          <div className="product-price">${product.price.toFixed(2)}</div>

          <button className="btn-add-to-cart-large" onClick={addToCart}>
            Add to Cart
          </button>
        </div>
      </div>

      {/* Reviews */}
      <section className="reviews-section">
        <h2>Customer Reviews ({product.reviews?.length || 0})</h2>

        {product.reviews?.length > 0 ? (
          <div className="reviews-list">
            {product.reviews.map((r, i) => (
              <div key={i} className="review-card">
                <strong>{r.userId?.name || "Anonymous"}</strong>
                <span className="review-date">
                  {new Date(r.createdAt).toLocaleDateString()}
                </span>
                <p>{r.comment}</p>
              </div>
            ))}
          </div>
        ) : (
          <p>No reviews yet. Be the first!</p>
        )}

        {/* Write Review */}
        {isLoggedIn && user?.userType === "buyer" ? (
          <div className="write-review">
            <textarea
              placeholder="Write your review here..."
              value={newReview}
              onChange={(e) => setNewReview(e.target.value)}
              rows="4"
            />
            <button onClick={submitReview} className="btn-review-submit">
              Submit Review
            </button>
          </div>
        ) : (
          <p>
            <a href="#" onClick={(e) => { e.preventDefault(); onStartShopping?.(); }}>
              Log in
            </a>{" "}to write a review
          </p>
        )}
      </section>

      {/* Recommended Products — ALREADY WORKING! */}
      {recommended.length > 0 && (
        <section className="recommended-section">
          <h2>You May Also Like</h2>
          <div className="recommended-grid">
            {recommended.map((item) => (
              <div
                key={item._id}
                className="recommended-card"
                onClick={() => navigate(`/product/${item._id}`)}
                style={{ cursor: "pointer" }}
              >
                {item.images?.[0] ? (
                  <img src={item.images[0]} alt={item.name} loading="lazy" />
                ) : (
                  <div className="placeholder-img">Image</div>
                )}
                <h3>{item.name}</h3>
                <p className="price">${item.price.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}