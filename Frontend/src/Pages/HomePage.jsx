import React, { useState, useEffect } from "react";
import "../Style/HomePage.css";
import { getAllPosts, searchPosts, getCategories } from "../apis/Postsapi";
import { useToast } from "../components/ToastContext";

export default function HomePage({
  onNavigate,
  onStartShopping,
  isLoggedIn,
  user,
  searchQuery: externalSearchQuery,
  searchTrigger,
}) {
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [categories, setCategories] = useState(["all"]);
  const [loading, setLoading] = useState(false);
  const { showSuccess } = useToast();

  // Fetch posts on mount or when search is triggered
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        let response;
        
        if (externalSearchQuery && externalSearchQuery.trim()) {
          // Use search API when there's a search query
          response = await searchPosts(externalSearchQuery);
        } else {
          // Use getAllPosts when no search
          response = await getAllPosts({ limit: 50 });
        }
        
        const fetchedPosts = response?.result || [];
        setPosts(fetchedPosts);
        setFilteredPosts(fetchedPosts);
      } catch (e) {
        console.error("Failed to fetch posts:", e);
        setPosts([]);
        setFilteredPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [externalSearchQuery]);

  // Filter by category only (search is handled by backend)
  useEffect(() => {
    let filtered = posts;

    if (selectedCategory !== "all") {
      filtered = filtered.filter((p) =>
        (p.category || "").toString().toLowerCase() ===
        selectedCategory.toString().toLowerCase()
      );
    }

    setFilteredPosts(filtered);
  }, [selectedCategory, posts]);

  const handleContactSeller = (post) => {
    if (!isLoggedIn) {
      onStartShopping(); // Redirect to login if not logged in
      return;
    }

    // Navigate to seller profile or show contact modal
    onNavigate("seller-profile", { sellerId: post.sellerId });
    showSuccess("View seller profile to contact");
  };

  const handleSavePost = (post) => {
    if (!isLoggedIn) {
      onStartShopping(); // Redirect to login if not logged in
      return;
    }

    showSuccess(`Saved "${post.title}"`);
  };

  const handleStartShoppingClick = () => {
    if (!isLoggedIn) {
      onStartShopping(); // Go to login
    } else {
      // Already logged in, focus on search
      document.querySelector(".search-container")?.focus();
    }
  };

  const handleCreatePost = () => {
    if (!isLoggedIn) {
      onStartShopping(); // Go to login first
    } else {
      onNavigate("create-post"); // Navigate to post creation
    }
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await getCategories();
        const cats = res.result || [];
        // ensure 'all' first and preserve casing for display
        setCategories(["all", ...cats]);
      } catch (err) {
        console.error("Failed to load categories:", err);
      }
    };

    fetchCategories();
  }, []);

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">
            Find anything you want.
            <br />
            <span className="gradient-text">Buy or Sell locally.</span>
          </h1>
          <p className="hero-description">
            Discover thousands of listings from your community. Fast, secure,
            and reliable peer-to-peer marketplace.
          </p>
          <div className="hero-cta">
            <div className="cta-buttons">
              <button
                className="btn-primary btn-lg"
                onClick={handleStartShoppingClick}
              >
                {isLoggedIn ? "Browse Listings" : "Start Browsing"}
              </button>
              {isLoggedIn && (
                <button
                  className="btn-secondary btn-lg"
                  onClick={handleCreatePost}
                  style={{ marginLeft: "10px" }}
                >
                  Create Listing
                </button>
              )}
            </div>
            {!isLoggedIn && (
              <p
                style={{
                  marginTop: "1rem",
                  color: "#666",
                  fontSize: "0.875rem",
                }}
              >
                Login to browse listings or create your own
              </p>
            )}
          </div>
        </div>
        <div className="hero-visual">
          <div className="floating-card card-1">🏠</div>
          <div className="floating-card card-2">🛍️</div>
          <div className="floating-card card-3">✨</div>
        </div>
      </section>

      {/* Category Filter Section */}
      {isLoggedIn && (
        <section className="search-section">
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

      {/* Posts Grid - Show to everyone */}
      <section className="products-section">
        <div className="products-header">
          <h2>
            {selectedCategory === "all"
              ? "Featured Listings"
              : `${
                  selectedCategory.charAt(0).toUpperCase() +
                  selectedCategory.slice(1)
                } Listings`}
          </h2>
          {!isLoggedIn && (
            <p className="product-notice">Login to browse and list items!</p>
          )}
        </div>

        {loading ? (
          <div className="empty-state">
            <p>Loading listings...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"></div>
            <h3>No listings found</h3>
            <p>Try adjusting your search or category filters</p>
            {isLoggedIn && (
              <button
                onClick={handleCreatePost}
                className="btn-secondary"
                style={{ marginTop: "1rem" }}
              >
                Create a Listing
              </button>
            )}
          </div>
        ) : (
          <div className="products-grid">
            {filteredPosts.map((post) => (
              <div
                key={post._id}
                className="product-card"
                onClick={() => {
                  if (isLoggedIn) {
                    onNavigate("post-details", { post });
                  } else {
                    onNavigate("login");
                  }
                }}
                style={{ cursor: "pointer" }}
              >
                <div className="product-image">
                  <img
                    src={post.images?.[0] || ""}
                    alt={post.title}
                    className="product-img"
                    style={{ display: post.images?.[0] ? "block" : "none" }}
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.nextSibling.style.display = "flex";
                    }}
                  />
                  <span
                    className="product-emoji"
                    style={{ display: post.images?.[0] ? "none" : "flex" }}
                  >
                    📦
                  </span>
                </div>
                <div className="product-content">
                  <h3 className="product-name">{post.title}</h3>
                  <p className="product-description">
                    {post.description?.substring(0, 60)}...
                  </p>
                  <div className="product-meta">
                    <span className="category">{post.category}</span>
                    <span className="rating">
                      ⭐ {post.likes?.length || 0} likes
                    </span>
                  </div>
                  <div className="product-footer">
                    {post.price && (
                      <span className="price">${post.price.toFixed(2)}</span>
                    )}
                    <div className="btn-group">
                      {isLoggedIn && (
                        <button
                          className="btn-save"
                          onClick={() => handleSavePost(post)}
                          title="Save"
                        >
                          💾
                        </button>
                      )}
                      <button
                        className="btn-contact"
                        onClick={() => handleContactSeller(post)}
                        disabled={!isLoggedIn}
                      >
                        {!isLoggedIn ? "Login" : "Contact"}
                      </button>
                    </div>
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
          <div className="stat-number">500K+</div>
          <div className="stat-label">Listings</div>
        </div>
        <div className="stat">
          <div className="stat-number">98%</div>
          <div className="stat-label">Satisfaction</div>
        </div>
        <div className="stat">
          <div className="stat-number">100K+</div>
          <div className="stat-label">Active Sellers</div>
        </div>
      </section>

      {/* Call to Action for Sellers */}
      {isLoggedIn && (
        <section className="seller-cta">
          <div className="seller-cta-content">
            <h2>Start Selling Today</h2>
            <p>List your items and connect with buyers in your area</p>
            <button
              className="btn-primary btn-lg"
              onClick={handleCreatePost}
            >
              Create Your First Listing
            </button>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4>Browse</h4>
            <ul>
              <li>
                <a href="#listings">All Listings</a>
              </li>
              <li>
                <a href="#categories">Categories</a>
              </li>
              <li>
                <a href="#deals">Trending</a>
              </li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Sell</h4>
            <ul>
              <li>
                <a
                  href="#sell"
                  onClick={(e) => {
                    e.preventDefault();
                    handleCreatePost();
                  }}
                >
                  Create Listing
                </a>
              </li>
              <li>
                <a href="#seller-guide">Seller Guide</a>
              </li>
              <li>
                <a href="#fees">Fees</a>
              </li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Support</h4>
            <ul>
              <li>
                <a href="#help">Help Center</a>
              </li>
              <li>
                <a href="#contact">Contact</a>
              </li>
              <li>
                <a href="#status">Status</a>
              </li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Legal</h4>
            <ul>
              <li>
                <a href="#privacy">Privacy</a>
              </li>
              <li>
                <a href="#terms">Terms</a>
              </li>
              <li>
                <a href="#security">Security</a>
              </li>
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
