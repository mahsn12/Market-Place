import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProductRow from '../components/ProductRow';
import '../Style/CheckoutPage.css';

export default function CheckoutPage() {
  const [cart, setCart] = useState([]);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [subtotal, setSubtotal] = useState(0);
  const [shipping, setShipping] = useState(0);
  const [tax, setTax] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    // Load cart from localStorage or API
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
      item.id === itemId ? { ...item, qty: newQty } : item
    );
    setCart(updated);
    localStorage.setItem('cart', JSON.stringify(updated));
    calculateTotals(updated);
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
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart,
          note: note,
          total: total
        })
      });
      
      if (response.ok) {
        alert('Order placed successfully');
        setCart([]);
        setNote('');
        localStorage.removeItem('cart');
      }
    } catch (e) {
      console.error(e);
      alert('Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout-page">
      <Navbar />
      <main className="checkout-main">
        <section className="checkout-items">
          <h2>Checkout</h2>

          {cart.length === 0 ? (
            <div className="empty-state">Your cart is empty.</div>
          ) : (
            <div className="items-list">
              {cart.map(item => (
                <ProductRow key={item.id} item={item} onQtyChange={handleQtyChange} onRemove={handleRemove} />
              ))}
            </div>
          )}

          <div className="order-note-section">
            <label>Order note</label>
            <textarea value={note} onChange={(e)=>setNote(e.target.value)} placeholder="E.g. Leave at the back door"></textarea>
          </div>
        </section>

        <aside className="checkout-summary">
          <div className="summary-box">
            <div className="summary-row">
              <div>Subtotal</div>
              <div>${subtotal.toFixed(2)}</div>
            </div>
            <div className="summary-row">
              <div>Shipping</div>
              <div>${shipping.toFixed(2)}</div>
            </div>
            <div className="summary-row">
              <div>Tax</div>
              <div>${tax.toFixed(2)}</div>
            </div>
            <div className="summary-total">
              <div>Total</div>
              <div>${total.toFixed(2)}</div>
            </div>
          </div>

          <div className="checkout-actions">
            <button onClick={placeOrder} disabled={cart.length===0 || loading} className="btn-primary">
              {loading ? 'Placing...' : 'Place order'}
            </button>
            <button className="btn-secondary">Pay with card</button>
          </div>
        </aside>
      </main>
      <Footer />
    </div>
  );
}
