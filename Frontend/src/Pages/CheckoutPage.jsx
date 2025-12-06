import React, { useEffect, useState } from 'react';
import PageLayout from '../components/PageLayout';
import '../Style/CheckoutPage.css';

export default function CheckoutPage() {
  const [cart, setCart] = useState([]);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [subtotal, setSubtotal] = useState(0);
  const [shipping, setShipping] = useState(0);
  const [tax, setTax] = useState(0);
  const [total, setTotal] = useState(0);
  const [cardData, setCardData] = useState({
    cardNumber: '',
    cardName: '',
    expiration: '',
    cvv: ''
  });

  useEffect(() => {
    const savedCart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCart(savedCart);
    calculateTotals(savedCart);
  }, []);

  const calculateTotals = (cartItems) => {
    const newSubtotal = cartItems.reduce((sum, item) => sum + item.price * item.qty, 0);
    const newShipping = newSubtotal > 0 ? 10 : 0;
    const newTax = newSubtotal * 0.1;
    const newTotal = newSubtotal + newShipping + newTax;

    setSubtotal(newSubtotal);
    setShipping(newShipping);
    setTax(newTax);
    setTotal(newTotal);
  };

  const handleQtyChange = (itemId, newQty) => {
    const updated = cart.map(item =>
      item.id === itemId ? { ...item, qty: Math.max(1, newQty) } : item
    );
    setCart(updated);
    localStorage.setItem('cart', JSON.stringify(updated));
    calculateTotals(updated);
  };

  const handleQtyIncrease = (itemId) => {
    const item = cart.find(i => i.id === itemId);
    if (item) {
      handleQtyChange(itemId, (item.qty || 1) + 1);
    }
  };

  const handleQtyDecrease = (itemId) => {
    const item = cart.find(i => i.id === itemId);
    if (item && (item.qty || 1) > 1) {
      handleQtyChange(itemId, (item.qty || 1) - 1);
    }
  };

  const handleRemove = (itemId) => {
    const updated = cart.filter(item => item.id !== itemId);
    setCart(updated);
    localStorage.setItem('cart', JSON.stringify(updated));
    calculateTotals(updated);
  };

  const placeOrder = async () => {
    try {
      setLoading(true);

      // Create order object
      const order = {
        _id: `order_${Date.now()}`,
        items: cart,
        note: note,
        subtotal: subtotal,
        shipping: shipping,
        tax: tax,
        total: total,
        status: 'Processing',
        createdAt: new Date().toISOString(),
        cardLast4: cardData.cardNumber.slice(-4)
      };

      // Save to localStorage
      const existingOrders = JSON.parse(localStorage.getItem('orders') || '[]');
      existingOrders.push(order);
      localStorage.setItem('orders', JSON.stringify(existingOrders));

      // Try to send to backend if available
      try {
        await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(order)
        });
      } catch (e) {
        console.log('Backend unavailable, order saved to local storage');
      }

      alert('Order placed successfully!');
      setCart([]);
      setNote('');
      setCardData({ cardNumber: '', cardName: '', expiration: '', cvv: '' });
      localStorage.removeItem('cart');
      calculateTotals([]);
    } catch (e) {
      console.error(e);
      alert('Failed to place order');
    } finally {
      setLoading(false);
    }
  };
 const handleBackToShopping = () => {
  onNavigate('/Frontend/Pages/HomePage');  // This already goes to home page
};
  return (
    <PageLayout title="Your Cart">
      <div className="checkout-content shopping-cart">
        <section className="checkout-items">
          <h2 className="checkout-heading">Your Products</h2>
          {cart.length === 0 ? (
            <div className="empty-checkout">
              <div className="empty-icon">🛍️</div>
              <h3>Your cart is empty</h3>
              <p>Add items from the marketplace to get started</p>
            </div>
          ) : (
            <div className="items-list">
              {cart.map(item => (
                <div key={item.id} className="product-row-card">
                  <div className="product-image">
                    <img
                      src={item.image || 'https://via.placeholder.com/150'}
                      alt={item.name}
                    />
                  </div>
                  <div className="product-details">
                    <div className="product-header">
                      <div>
                        <h5 className="product-name">{item.name || 'Product'}</h5>
                        <p className="product-color">{item.seller || 'Unknown Seller'}</p>
                      </div>
                      <button
                        onClick={() => handleRemove(item.id)}
                        className="product-remove-btn"
                        title="Remove item"
                      >
                        ×
                      </button>
                    </div>
                    <div className="product-footer">
                      <p className="product-price">${(item.price || 0).toFixed(2)}</p>
                      <div className="number-input">
                        <button
                          type="button"
                          className="minus"
                          onClick={() => handleQtyDecrease(item.id)}
                        ></button>
                        <input
                          type="number"
                          min="1"
                          value={item.qty || 1}
                          onChange={(e) => handleQtyChange(item.id, parseInt(e.target.value) || 1)}
                        />
                        <button
                          type="button"
                          className="plus"
                          onClick={() => handleQtyIncrease(item.id)}
                        ></button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {cart.length > 0 && (
            <div className="order-note-section">
              <label>Order notes (optional)</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add delivery instructions or special requests..."
              />
            </div>
          )}
        </section>

        <aside className="checkout-summary">
          <h3>Payment</h3>

          {cart.length > 0 && (
            <div className="order-totals">
              <div className="total-row">
                <span>Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="total-row">
                <span>Shipping:</span>
                <span>${shipping.toFixed(2)}</span>
              </div>
              <div className="total-row">
                <span>Tax (10%):</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="total-row total-final">
                <span>Total:</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          )}

          <form className="payment-form">
            <div className="form-group">
              <label>Card number</label>
              <input
                type="text"
                placeholder="1234 5678 9012 3457"
                maxLength="19"
                value={cardData.cardNumber}
                onChange={(e) => setCardData({ ...cardData, cardNumber: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Name on card</label>
              <input
                type="text"
                placeholder="John Smith"
                value={cardData.cardName}
                onChange={(e) => setCardData({ ...cardData, cardName: e.target.value })}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Expiration</label>
                <input
                  type="text"
                  placeholder="MM/YYYY"
                  maxLength="7"
                  value={cardData.expiration}
                  onChange={(e) => setCardData({ ...cardData, expiration: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>CVV</label>
                <input
                  type="text"
                  placeholder="•••"
                  maxLength="3"
                  value={cardData.cvv}
                  onChange={(e) => setCardData({ ...cardData, cvv: e.target.value })}
                />
              </div>
            </div>

            <p className="form-disclaimer">
              By completing this purchase, you agree to our terms and conditions.
            </p>

            <button
              type="button"
              onClick={placeOrder}
              disabled={cart.length === 0 || loading}
              className="btn-primary"
            >
              {loading ? 'Processing...' : 'Buy Now'}
            </button>

            <button
              type="button"
              className="btn-secondary"
            >
              💳 Pay with Card
            </button>

            <div className="back-to-shopping">
          <a 
            
            onClick={(e) => {
              e.preventDefault();
              handleBackToShopping();  // This calls onNavigate('home')
            }}
            >
            ← Back to shopping
          </a>
        </div>
          </form>
        </aside>
      </div>
    </PageLayout>
  );
}
