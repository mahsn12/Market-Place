import React, { useState, useEffect } from 'react';
import '../Style/HomePage.css';

export default function HomePage({ onNavigate, onStartShopping, isLoggedIn, user }) {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    // Load mock products
    const mockProducts = [
      { id: 1, name: 'Wireless Headphones', category: 'electronics', price: 79.99, seller: 'Tech Store', rating: 4.5, image: '🎧' },
      { id: 2, name: 'Vintage Coffee Table', category: 'furniture', price: 149.99, seller: 'Home Decor', rating: 4.8, image: '🪑' },
      { id: 3, name: 'Running Shoes', category: 'fashion', price: 89.99, seller: 'Sport Pro', rating: 4.6, image: '👟' },
      { id: 4, name: 'Smartphone Case', category: 'electronics', price: 19.99, seller: 'Mobile Gear', rating: 4.3, image: '📱' },
      { id: 5, name: 'Leather Wallet', category: 'fashion', price: 45.99, seller: 'Fashion Hub', rating: 4.7, image: '👜' },
      { id: 6, name: 'Desk Lamp', category: 'furniture', price: 34.99, seller: 'Lighting Co', rating: 4.4, image: '💡' },
      { id: 7, name: 'Bluetooth Speaker', category: 'electronics', price: 59.99, seller: 'Audio Pro', rating: 4.8, image: '🔊' },
      { id: 8, name: 'Winter Jacket', category: 'fashion', price: 129.99, seller: 'Fashion Hub', rating: 4.5, image: '🧥' },
    ];
    setProducts(mockProducts);
    setFilteredProducts(mockProducts);
  }, []);

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

    // Only buyers can add to cart
    if (user?.userType !== 'buyer') {
      alert('Sellers cannot add items to cart. Switch to buyer account to shop.');
      return;
    }

    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingItem = cart.find(item => item.id === product.id);

    if (existingItem) {
      existingItem.qty += 1;
    } else {
      cart.push({ ...product, qty: 1 });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    alert(`${product.name} added to cart!`);
    onNavigate('checkout');
  };

  const handleStartShoppingClick = () => {
    if (!isLoggedIn) {
      onStartShopping(); // Go to login
    } else if (user?.userType === 'seller') {
      alert('You are logged in as a seller. Switch to buyer account to shop.');
    } else {
      // Already logged in as buyer, focus on search
      document.querySelector('.search-container')?.focus();
    }
  };

  const categories = ['all', 'electronics', 'furniture', 'fashion'];

  return (
    <div className="home-page">
      <HomeTopNav
      isLoggedIn={isLoggedIn}
      onNavigate={onNavigate}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      user={user}
      />
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
            <button 
              className="btn-primary btn-lg" 
              onClick={handleStartShoppingClick}
            >
              {isLoggedIn ? 'Continue Shopping' : 'Start Shopping'}
            </button>
            {isLoggedIn && user?.userType === 'seller' && (
              <p style={{ marginTop: '1rem', color: '#666', fontSize: '0.875rem' }}>
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

      {/* Search & Filter Section - Only show if logged in as buyer or not logged in */}
      {(isLoggedIn && user?.userType === 'buyer') && (
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

      {/* Products Grid - Show to everyone, but only buyers can add to cart */}
      <section className="products-section">
        <div className="products-header">
          <h2>{selectedCategory === 'all' ? 'Featured Products' : `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}`}</h2>
          {!isLoggedIn && (
            <p className="product-notice">Login to start shopping!</p>
          )}
          {isLoggedIn && user?.userType === 'seller' && (
            <p className="product-notice">Switch to buyer account to shop</p>
          )}
        </div>

        {filteredProducts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <h3>No products found</h3>
            <p>Try adjusting your search or category filters</p>
          </div>
        ) : (
          <div className="products-grid">
            {filteredProducts.map(product => (
              <div key={product.id} className="product-card">
                <div className="product-image">
                  <span className="product-emoji">{product.image}</span>
                </div>
                <div className="product-content">
                  <h3 className="product-name">{product.name}</h3>
                  <div className="product-meta">
                    <span className="seller">{product.seller}</span>
                    <span className="rating">⭐ {product.rating}</span>
                  </div>
                  <div className="product-footer">
                    <span className="price">${product.price.toFixed(2)}</span>
                    <button
                      className="btn-add-to-cart"
                      onClick={() => addToCart(product)}
                      disabled={isLoggedIn && user?.userType === 'seller'}
                    >
                      {!isLoggedIn ? 'Login to Buy' : 
                       user?.userType === 'seller' ? 'Seller Mode' : 'Add'}
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