import React, { useEffect, useState } from 'react';
import '../Style/SellerDashboard.css';

export default function SellerDashboard() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [metrics, setMetrics] = useState({ revenue: 0, orders: 0, pending: 0, products: 0 });
  const [loading, setLoading] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    category: '',
    description: '',
    image: '📦'
  });

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  useEffect(() => {
    loadSellerData();
  }, []);

  const loadSellerData = () => {
    setLoading(true);
    try {
      const storedOrders = JSON.parse(localStorage.getItem('orders') || '[]');
      const storedProducts = JSON.parse(localStorage.getItem('sellerProducts') || '[]');

      // Calculate metrics
      const totalRevenue = storedOrders.reduce((sum, order) => sum + (order.total || 0), 0);
      const processingCount = storedOrders.filter(o => o.status === 'Processing').length;

      setOrders(storedOrders);
      setProducts(storedProducts);
      setMetrics({
        revenue: totalRevenue,
        orders: storedOrders.length,
        pending: processingCount,
        products: storedProducts.length
      });
    } catch (e) {
      console.error('Error loading seller data:', e);
      setOrders([]);
      setProducts([]);
      setMetrics({ revenue: 0, orders: 0, pending: 0, products: 0 });
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId, newStatus) => {
    try {
      const updatedOrders = orders.map(order =>
        order._id === orderId ? { ...order, status: newStatus } : order
      );
      setOrders(updatedOrders);
      localStorage.setItem('orders', JSON.stringify(updatedOrders));
      loadSellerData(); // Reload metrics
    } catch (e) {
      console.error('Error updating order status:', e);
    }
  };

  const handleAddProduct = (e) => {
    e.preventDefault();
    const product = {
      id: Date.now(),
      name: newProduct.name,
      price: parseFloat(newProduct.price),
      category: newProduct.category,
      description: newProduct.description,
      image: newProduct.image,
      seller: 'You',
      rating: 5.0,
      createdAt: new Date().toISOString()
    };

    const updatedProducts = [...products, product];
    setProducts(updatedProducts);
    localStorage.setItem('sellerProducts', JSON.stringify(updatedProducts));
    
    setNewProduct({ name: '', price: '', category: '', description: '', image: '📦' });
    setMetrics(prev => ({ ...prev, products: updatedProducts.length }));
    alert('Product added successfully!');
  };

  const deleteProduct = (productId) => {
    const updatedProducts = products.filter(p => p.id !== productId);
    setProducts(updatedProducts);
    localStorage.setItem('sellerProducts', JSON.stringify(updatedProducts));
    setMetrics(prev => ({ ...prev, products: updatedProducts.length }));
  };

  return (
    <div className="seller-dashboard-page">
      <div className="seller-dashboard-main">
        <div className="seller-dashboard-content">
          <h2>Seller Dashboard</h2>
          <p className="dashboard-subtitle">
            Manage your products and track your orders
          </p>

          {/* Metrics Grid */}
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-label">Total Revenue</div>
              <div className="metric-value">${metrics.revenue?.toFixed(2) || '0.00'}</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Total Orders</div>
              <div className="metric-value">{metrics.orders || 0}</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Processing Orders</div>
              <div className="metric-value">{metrics.pending || 0}</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Your Products</div>
              <div className="metric-value">{metrics.products || 0}</div>
            </div>
          </div>

          {/* Add Product Section */}
          <section className="add-product-section">
            <h3>Add New Product</h3>
            <form onSubmit={handleAddProduct} className="product-form">
              <div className="form-row">
                <input
                  type="text"
                  placeholder="Product Name"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                  required
                  className="form-input"
                />
                <input
                  type="number"
                  placeholder="Price"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                  required
                  className="form-input"
                />
              </div>
              <select
                value={newProduct.category}
                onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                required
                className="form-input"
              >
                <option value="">Select Category</option>
                <option value="electronics">Electronics</option>
                <option value="fashion">Fashion</option>
                <option value="furniture">Furniture</option>
                <option value="home">Home & Garden</option>
                <option value="sports">Sports</option>
              </select>
              <textarea
                placeholder="Product Description"
                value={newProduct.description}
                onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                required
                className="form-textarea"
              />
              <button type="submit" className="btn-primary btn-full">
                Add Product
              </button>
            </form>
          </section>

          {/* Products List Section */}
          <section className="products-section">
            <h3>Your Products ({products.length})</h3>
            {products.length === 0 ? (
              <div className="empty-state">
                <p>No products yet. Add your first product above!</p>
              </div>
            ) : (
              <div className="products-grid">
                {products.map(product => (
                  <div key={product.id} className="product-card">
                    <div className="product-image">
                      <span className="product-emoji">{product.image}</span>
                    </div>
                    <div className="product-content">
                      <h4 className="product-name">{product.name}</h4>
                      <p className="product-description">{product.description}</p>
                      <div className="product-footer">
                        <span className="product-price">${product.price.toFixed(2)}</span>
                        <span className="product-category">{product.category}</span>
                      </div>
                      <button 
                        onClick={() => deleteProduct(product.id)}
                        className="btn-delete"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Orders Section */}
          <section className="orders-section">
            <h3>Recent Orders</h3>
            {loading ? (
              <div className="loading-state">Loading...</div>
            ) : orders.length === 0 ? (
              <div className="empty-state">
                <p>No orders yet. Your orders will appear here!</p>
              </div>
            ) : (
              <div className="orders-container">
                {orders.slice().reverse().map(order => (
                  <div key={order._id} className="order-row">
                    <div className="order-info">
                      <div className="order-id">Order #{order._id}</div>
                      <div className="order-items">
                        {order.items?.length > 0
                          ? `${order.items.length} item${order.items.length !== 1 ? 's' : ''}: ${order.items.map(i => i.name || i.title || 'Product').join(', ')}`
                          : 'No items'}
                      </div>
                      <div className="order-date">{formatDate(order.createdAt)}</div>
                    </div>
                    <div className="order-actions">
                      <div className="order-total">${order.total?.toFixed(2) || '0.00'}</div>
                      <select 
                        value={order.status} 
                        onChange={(e) => updateStatus(order._id, e.target.value)} 
                        className="status-select"
                      >
                        <option value="Processing">Processing</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}