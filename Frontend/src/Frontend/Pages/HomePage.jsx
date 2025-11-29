import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../Style/HomePage.css";

export default function HomePage({ onStartShopping, isLoggedIn, user }) {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);

  // ✅ Load products from database
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("http://localhost:5200/api/products");
        const data = await res.json();
        console.log("Fetched products:", data); 
        setProducts(data.result || []);
        setFilteredProducts(data.result || []);
      } catch (err) {
        console.error("Error fetching products:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // ✅ Filtering & searching
  useEffect(() => {
    let filtered = [...products];

    if (selectedCategory !== "all") {
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.sellerId?.name || "")
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
      );
    }

    setFilteredProducts(filtered);
  }, [searchQuery, selectedCategory, products]);

  // ✅ Add to cart (same logic)
  const addToCart = (product) => {
    if (!isLoggedIn) {
      onStartShopping();
      return;
    }

    if (user?.userType !== "buyer") {
      alert("Sellers cannot add items to cart. Switch to buyer account to shop.");
      return;
    }

    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const existingItem = cart.find((item) => item._id === product._id);

    if (existingItem) {
      existingItem.qty += 1;
    } else {
      cart.push({ ...product, qty: 1 });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    alert(`${product.name} added to cart!`);
    navigate("/checkout");
  };

  const handleStartShoppingClick = () => {
    if (!isLoggedIn) {
      onStartShopping();
    } else if (user?.userType === "seller") {
      alert("You are logged in as a seller. Switch to buyer account to shop.");
    } else {
      document.querySelector(".search-container")?.focus();
    }
  };

  const categories = ["all", "electronics", "furniture", "fashion"];

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">
            Find anything you want.
            <br />
            <span className="gradient-text">Buy it instantly.</span>
          </h1>
          <p className="hero-description">
            Discover thousands of products from trusted sellers. Fast, secure, and reliable.
          </p>
          <div className="hero-cta">
            <button className="btn-primary btn-lg" onClick={handleStartShoppingClick}>
              {isLoggedIn ? "Continue Shopping" : "Start Shopping"}
            </button>
            {isLoggedIn && user?.userType === "seller" && (
              <p style={{ marginTop: "1rem", color: "#666", fontSize: "0.875rem" }}>
                You are in seller mode. Switch to buyer account to shop.
              </p>
            )}
          </div>
        </div>
        <div className="hero-visual">
          <div className="floating-card card-1">📦</div>
          <div className="floating-card card-2">🛍️</div>
          <div className="floating-card card-3">✨</div>
        </div>
      </section>

      {/* Search Section */}
      {(isLoggedIn && user?.userType === "buyer") && (
        <section className="search-section">
          <div className="search-wrapper">
            <input
              type="text"
              className="search-container"
              placeholder="Search for products, sellers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <span className="search-icon">🔍</span>
          </div>

          <div className="categories">
            {categories.map((category) => (
              <button
                key={category}
                className={`category-pill ${
                  selectedCategory === category ? "active" : ""
                }`}
                onClick={() => setSelectedCategory(category)}
              >
                {category === "all"
                  ? "All"
                  : category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Products Section */}
      <section className="products-section">
        <div className="products-header">
          <h2>
            {selectedCategory === "all"
              ? "Featured Products"
              : selectedCategory.charAt(0).toUpperCase() +
                selectedCategory.slice(1)}
          </h2>
          {!isLoggedIn && <p className="product-notice">Login to start shopping!</p>}
          {isLoggedIn && user?.userType === "seller" && (
            <p className="product-notice">Switch to buyer account to shop</p>
          )}
        </div>

        {loading ? (
          <div className="empty-state">
            <div className="empty-icon">⏳</div>
            <h3>Loading products...</h3>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <h3>No products found</h3>
            <p>Try adjusting your search or category filters</p>
          </div>
        ) : (
          <div className="products-grid">
            {filteredProducts.map((product) => (
              <div
                key={product._id}
                className="product-card"
                onClick={() => navigate(`/product/${product._id}`)} // ✅ Go to ProductPage
              >
                <div className="product-image">
                  {product.images && product.images[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="product-emoji"
                      style={{ width: "100%", borderRadius: "0.75rem" }}
                    />
                  ) : (
                    <span className="product-emoji">🛍️</span>
                  )}
                </div>
                <div className="product-content">
                  <h3 className="product-name">{product.name}</h3>
                  <div className="product-meta">
                    <span className="seller">{product.sellerId?.name || "Seller"}</span>
                    <span className="rating">⭐ {product.rating || 4.5}</span>
                  </div>
                  <div className="product-footer">
                    <span className="price">${product.price?.toFixed(2)}</span>
                    <button
                      className="btn-add-to-cart"
                      onClick={(e) => {
                        e.stopPropagation(); // prevent click from opening ProductPage
                        addToCart(product);
                      }}
                      disabled={isLoggedIn && user?.userType === "seller"}
                    >
                      {!isLoggedIn
                        ? "Login to Buy"
                        : user?.userType === "seller"
                        ? "Seller Mode"
                        : "Add"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stat">
          <div className="stat-number">2M+</div>
          <div className="stat-label">Active Users</div>
        </div>
        <div className="stat">
          <div className="stat-number">50K+</div>
          <div className="stat-label">Products</div>
        </div>
        <div className="stat">
          <div className="stat-number">98%</div>
          <div className="stat-label">Satisfaction</div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4>About</h4>
            <ul>
              <li><a href="#about">About Us</a></li>
              <li><a href="#blog">Blog</a></li>
              <li><a href="#careers">Careers</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Support</h4>
            <ul>
              <li><a href="#help">Help Center</a></li>
              <li><a href="#contact">Contact</a></li>
              <li><a href="#status">Status</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Legal</h4>
            <ul>
              <li><a href="#privacy">Privacy</a></li>
              <li><a href="#terms">Terms</a></li>
              <li><a href="#security">Security</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2024 Marketplace. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
