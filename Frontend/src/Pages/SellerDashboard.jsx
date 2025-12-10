import React, { useEffect, useState } from 'react';
import '../Style/SellerDashboard.css';
import { getProductsBySeller, createProduct, deleteProduct as deleteProductApi } from '../apis/Productsapi';
import { getOrdersBySeller, updateOrderStatus } from '../apis/Orders';
import { useToast } from '../components/ToastContext';

export default function SellerDashboard({ user, onNavigate, onProductsRefresh }) {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [metrics, setMetrics] = useState({ revenue: 0, orders: 0, pending: 0, products: 0 });
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError, showWarning } = useToast();
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    category: '',
    description: '',
    stock: '',
    location: '',
    images: []
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
  }, [user]);

  const loadSellerData = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const [productsRes, ordersRes] = await Promise.all([
        getProductsBySeller(user.id),
        getOrdersBySeller(user.id)
      ]);

      const sellerProducts = productsRes.result || [];
      const sellerOrders = ordersRes.result || [];

      // Calculate metrics
      const totalRevenue = sellerOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
      const pendingCount = sellerOrders.filter(o => o.status === 'Pending').length;

      setProducts(sellerProducts);
      setOrders(sellerOrders);
      setMetrics({
        revenue: totalRevenue,
        orders: sellerOrders.length,
        pending: pendingCount,
        products: sellerProducts.length
      });
    } catch (e) {
      console.error('Failed to load seller data:', e);
      setOrders([]);
      setProducts([]);
      setMetrics({ revenue: 0, orders: 0, pending: 0, products: 0 });
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, { status: newStatus });
      loadSellerData(); // Reload data
    } catch (e) {
      console.error('Error updating order status:', e);
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const newImages = [];

    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        showWarning(`File ${file.name} is too large. Maximum size is 5MB.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        newImages.push(reader.result);
        if (newImages.length === files.length) {
          setNewProduct(prev => ({
            ...prev,
            images: [...prev.images, ...newImages]
          }));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setNewProduct(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const addImageUrl = () => {
    const url = prompt('Enter image URL:');
    if (url && url.trim()) {
      setNewProduct(prev => ({
        ...prev,
        images: [...prev.images, url.trim()]
      }));
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!newProduct.name.trim() || !newProduct.price || !newProduct.category || !newProduct.description.trim() || !newProduct.stock || !newProduct.location.trim()) {
      showWarning('Please fill in all required fields');
      return;
    }

    const price = parseFloat(newProduct.price);
    const stock = parseInt(newProduct.stock);

    if (isNaN(price) || price <= 0) {
      showWarning('Please enter a valid price');
      return;
    }

    if (isNaN(stock) || stock < 0) {
      showWarning('Please enter a valid stock quantity');
      return;
    }

    try {
      const productData = {
        name: newProduct.name.trim(),
        price: price,
        category: newProduct.category,
        description: newProduct.description.trim(),
        stock: stock,
        location: newProduct.location.trim(),
        images: newProduct.images,
        condition: 'new'
      };

      console.log('Sending product data:', productData);
      await createProduct(productData);
      
      setNewProduct({ name: '', price: '', category: '', description: '', stock: '', location: '', images: [] });
      loadSellerData();
      if (onProductsRefresh) onProductsRefresh();
      showSuccess('Product added successfully!');
    } catch (e) {
      console.error('Error adding product:', e);
      const errorMessage = e.message || e.error || e.response?.data?.message || 'Failed to add product';
      showError(`Error: ${errorMessage}`);
    }
  };

  const deleteProduct = async (productId) => {
    try {
      await deleteProductApi(productId);
      loadSellerData(); // Reload products
    } catch (e) {
      console.error('Error deleting product:', e);
      showError('Failed to delete product');
    }
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
                <input
                  type="number"
                  placeholder="Stock Quantity"
                  value={newProduct.stock}
                  onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})}
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
              <input
                type="text"
                placeholder="Location (e.g., City, Country)"
                value={newProduct.location}
                onChange={(e) => setNewProduct({...newProduct, location: e.target.value})}
                required
                className="form-input"
              />
              <textarea
                placeholder="Product Description"
                value={newProduct.description}
                onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                required
                className="form-textarea"
              />

              {/* Image Upload Section */}
              <div className="image-upload-section">
                <label className="image-upload-label">Product Images</label>
                <div className="image-upload-controls">
                  <label htmlFor="image-upload" className="upload-btn">
                    📁 Choose Files
                  </label>
                  <input
                    type="file"
                    id="image-upload"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                  />
                  <button type="button" onClick={addImageUrl} className="url-btn">
                    🔗 Add URL
                  </button>
                </div>

                {newProduct.images.length > 0 && (
                  <div className="image-preview-grid">
                    {newProduct.images.map((image, index) => (
                      <div key={index} className="image-preview-item">
                        <img src={image} alt={`Preview ${index + 1}`} className="preview-image" />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="remove-image-btn"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

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
                      <h4 className="product-name">{product.name}</h4>
                      <p className="product-description">{product.description}</p>
                      <div className="product-footer">
                        <span className="product-price">${product.price.toFixed(2)}</span>
                        <span className="product-category">{product.category}</span>
                      </div>
                      <button 
                        onClick={() => deleteProduct(product._id)}
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
                      <div className="order-id">Order #{order._id.slice(-8)}</div>
                      <div className="order-items">
                        {order.products?.length > 0
                          ? `${order.products.length} item${order.products.length !== 1 ? 's' : ''}: ${order.products.map(i => i.productId?.name || 'Product').join(', ')}`
                          : 'No items'}
                      </div>
                      <div className="order-date">{formatDate(order.orderDate)}</div>
                    </div>
                    <div className="order-actions">
                      <div className="order-total">${order.totalPrice?.toFixed(2)}</div>
                      <select 
                        value={order.status} 
                        onChange={(e) => updateStatus(order._id, e.target.value)} 
                        className="status-select"
                      >
                        <option value="Pending">Pending</option>
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
