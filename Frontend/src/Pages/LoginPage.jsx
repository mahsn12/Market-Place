import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGoogle, faFacebookF } from '@fortawesome/free-brands-svg-icons';
import '../Style/LoginPage.css';
import { loginUser } from '../apis/Userapi';

function MarketplaceLogin({ onNavigate, onLogin }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    const res = await loginUser({
      email: formData.email,
      password: formData.password,
    });

    onLogin(res.user);
    localStorage.setItem("token", res.token);

    alert("Login successful!");
    if (onNavigate) onNavigate("home");
  } catch (err) {
    alert("Login failed: " + err.message);
  }
};
  const handleSignUpClick = () => {
    onNavigate('register');
  };

  return (
    <div className="marketplace-login-container">
      <div className="login-box">
        <div className="login-header">
          <h2>Welcome to Marketplace</h2>
          <p>Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          

          <div className="input-group">
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="form-input"
              placeholder="Enter your email"
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="form-input"
              placeholder="Enter your password"
            />
          </div>

          <div className="form-options">
            <label className="checkbox">
              <input type="checkbox" />
              <span>Remember me</span>
            </label>
            <a href="#forgot" className="forgot-link">Forgot password?</a>
          </div>

          <button type="submit" className="login-btn">
            Sign In
          </button>
        </form>

        <div className="divider">
          <span>or continue with</span>
        </div>

        <div className="social-login">
          <button className="social-btn google-btn">
            <FontAwesomeIcon icon={faGoogle} className="social-icon" />
            Google
          </button>
          <button className="social-btn facebook-btn">
            <FontAwesomeIcon icon={faFacebookF} className="social-icon" />
            Facebook
          </button>
        </div>

        <div className="login-footer">
          <p>
            Don't have an account?{' '}
            <button 
              onClick={handleSignUpClick}
              className="signup-link"
            >
              Sign up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default MarketplaceLogin;