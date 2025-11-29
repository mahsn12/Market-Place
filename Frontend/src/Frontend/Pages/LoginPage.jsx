import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGoogle, faFacebookF } from '@fortawesome/free-brands-svg-icons';
import '../Style/LoginPage.css';

function MarketplaceLogin({ onNavigate, onLogin }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'buyer' // buyer or seller
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // THIS IS THE CORRECT URL FOR YOUR CURRENT BACKEND
      const response = await fetch("http://localhost:5200/api/users/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      // SUCCESS!
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify({
        email: formData.email,
        userType: formData.role,  // use the selected role
      }));

      if (onLogin) {
        onLogin({
          email: formData.email,
          userType: formData.role
        });
      }

      alert(`Welcome back, ${formData.role.toUpperCase()}!`);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="marketplace-login-container">
      <div className="login-box">
        <div className="login-header">
          <h2>Welcome to Marketplace</h2>
          <p>Sign in to continue</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">

          <div className="input-group">
            <label>I am signing in as:</label>
            <div className="user-type-selector">
              <label className="radio-option">
                <input type="radio" name="role" value="buyer" checked={formData.role === 'buyer'} onChange={handleChange} />
                <span className="radio-custom"></span> Buyer
              </label>
              <label className="radio-option">
                <input type="radio" name="role" value="seller" checked={formData.role === 'seller'} onChange={handleChange} />
                <span className="radio-custom"></span> Seller
              </label>
            </div>
          </div>

          <div className="input-group">
            <label>Email</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="you@example.com" />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} required placeholder="••••••••" />
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="divider"><span>or</span></div>

        <div className="social-login">
          <button className="social-btn google-btn" type="button"><FontAwesomeIcon icon={faGoogle} /> Google</button>
          <button className="social-btn facebook-btn" type="button"><FontAwesomeIcon icon={faFacebookF} /> Facebook</button>
        </div>

        <div className="login-footer">
          <p>
            Don't have an account?{' '}
            <button onClick={() => onNavigate('register')} className="signup-link">Sign up</button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default MarketplaceLogin;