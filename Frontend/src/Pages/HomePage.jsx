import React, { useState, useEffect } from 'react';
import '../Style/HomePage.css';
import { getAllProducts } from '../apis/Productsapi';
import { useToast } from '../components/ToastContext';

export default function HomePage({ onNavigate, onStartShopping, isLoggedIn, user, refreshTrigger }) {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { showSuccess } = useToast();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await getAllProducts();
        const fetchedProducts = response || [];
        setProducts(fetchedProducts);
        setFilteredProducts(fetchedProducts);
      } catch (e) {
        console.error('Failed to fetch products:', e);
        // Fallback to empty array
        setProducts([]);
        setFilteredProducts([]);
      }
    };

    fetchProducts();
  }, [refreshTrigger]);

  useEffect(() => {
    let filtered = products;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    if (searchQuery) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.seller.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredProducts(filtered);
  }, [searchQuery, selectedCategory, products]);

  const addToCart = (product) => {
    if (!isLoggedIn) {
      onStartShopping(); // Redirect to login if not logged in
      return;
    }

    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingItem = cart.find(item => item._id === product._id);

    if (existingItem) {
      existingItem.qty += 1;
    } else {
      cart.push({ ...product, qty: 1 });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    showSuccess(`${product.name} added to cart!`);
    onNavigate('checkout');
  };

  const handleStartShoppingClick = () => {
    if (!isLoggedIn) {
      onStartShopping(); // Go to login
    } else {
      // Already logged in, focus on search
      document.querySelector('.search-container')?.focus();
    }
  };

  const handleGoToSellerDashboard = () => {
    if (!isLoggedIn) {
      onStartShopping(); // Go to login first
    } else {
      onNavigate('seller'); // Navigate to seller dashboard
    }
  };

  const categories = ['all', 'electronics', 'furniture', 'fashion'];

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">
            Find anything you want.<br />
            <span className="gradient-text">Buy it instantly.</span>
          </h1>
          <p className="hero-description">
            Discover thousands of products from trusted sellers. Fast, secure, and reliable.
          </p>
          <div className="hero-cta">
            <div className="cta-buttons">
              <button 
                className="btn-primary btn-lg" 
                onClick={handleStartShoppingClick}
              >
                {isLoggedIn ? 'Continue Shopping' : 'Start Shopping'}
              </button>
              {isLoggedIn && (
                <button 
                  className="btn-secondary btn-lg" 
                  onClick={handleGoToSellerDashboard}
                  style={{ marginLeft: '10px' }}
                >
                  Go to Seller Dashboard
                </button>
              )}
            </div>
            {!isLoggedIn && (
              <p style={{ marginTop: '1rem', color: '#666', fontSize: '0.875rem' }}>
                Login to buy products or sell your own items
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

      {/* Search & Filter Section - Show to everyone when logged in */}
      {isLoggedIn && (
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
            {categories.map(category => (
              <button
                key={category}
                className={`category-pill ${selectedCategory === category ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category)}
              >
                {category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Products Grid - Show to everyone */}
      <section className="products-section">
        <div className="products-header">
          <h2>{selectedCategory === 'all' ? 'Featured Products' : `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}`}</h2>
          {!isLoggedIn && (
            <p className="product-notice">Login to start shopping!</p>
          )}
          
        </div>

        {filteredProducts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"></div>
            <h3>No products found</h3>
            <p>Try adjusting your search or category filters</p>
            {isLoggedIn && (
              <button 
                onClick={handleGoToSellerDashboard}
                className="btn-secondary"
                style={{ marginTop: '1rem' }}
              >
                Sell Your Products
              </button>
            )}
          </div>
        ) : (
          <div className="products-grid">
            {filteredProducts.map(product => (
              <div key={product._id} className="product-card">
                <div className="product-image">
                  <img 
                    src={product.images?.[0] || ''} 
                    alt={product.name} 
                    className="product-img" 
                    style={{display: product.images?.[0] ? 'block' : 'none'}}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <span className="product-emoji" style={{display: product.images?.[0] ? 'none' : 'flex'}}>
                    📦
                  </span>
                </div>
                <div className="product-content">
                  <h3 className="product-name">{product.name}</h3>
                  <div className="product-meta">
                    <span className="seller">{product.sellerId?.name || 'Unknown Seller'}</span>
                    <span className="rating">⭐ {product.views || 0} views</span>
                  </div>
                  <div className="product-footer">
                    <span className="price">${product.price.toFixed(2)}</span>
                    <button
                      className="btn-add-to-cart"
                      onClick={() => addToCart(product)}
                      disabled={!isLoggedIn}
                    >
                      {!isLoggedIn ? 'Login to Buy' : 'Add'}
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
        <div className="stat">
          <div className="stat-number">10K+</div>
          <div className="stat-label">Active Sellers</div>
        </div>
      </section>

      {/* Call to Action for Sellers */}
      {isLoggedIn && (
        <section className="seller-cta">
          <div className="seller-cta-content">
            <h2>Start Selling Today</h2>
            <p>List your products and reach thousands of buyers</p>
            <button 
              className="btn-primary btn-lg" 
              onClick={handleGoToSellerDashboard}
            >
              Go to Seller Dashboard
            </button>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4>Buy</h4>
            <ul>
              <li><a href="#products">All Products</a></li>
              <li><a href="#categories">Categories</a></li>
              <li><a href="#deals">Deals</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Sell</h4>
            <ul>
              <li><a href="#sell" onClick={(e) => { e.preventDefault(); handleGoToSellerDashboard(); }}>Start Selling</a></li>
              <li><a href="#seller-guide">Seller Guide</a></li>
              <li><a href="#fees">Fees</a></li>
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
