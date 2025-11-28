import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGoogle, faFacebookF } from '@fortawesome/free-brands-svg-icons';
import '../Style/RegisterPage.css';

function RegisterPage({ onNavigate, onRegister }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    userType: 'buyer'
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords don't match!");
      return;
    }
    
    console.log('Registration attempted:', formData);
    if (onRegister) {
      onRegister(formData);
    }
    alert('Registration successful! Welcome to Marketplace!');
  };

  return (
    <div className="marketplace-register-container">
      <div className="register-box">
        <div className="register-header">
          <h2>Join Marketplace</h2>
          <p>Create your account to start shopping or selling</p>
        </div>

        <form onSubmit={handleSubmit} className="register-form">
          <div className="name-fields">
            <div className="input-group">
              <label>First Name</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                className="form-input"
                placeholder="Enter your first name"
              />
            </div>
            
            <div className="input-group">
              <label>Last Name</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                className="form-input"
                placeholder="Enter your last name"
              />
            </div>
          </div>

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
              placeholder="Create a password"
              minLength="6"
            />
          </div>

          <div className="input-group">
            <label>Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="form-input"
              placeholder="Confirm your password"
            />
          </div>

          <div className="input-group">
            <label>I want to join as:</label>
            <div className="user-type-selector">
              <label className="radio-option">
                <input
                  type="radio"
                  name="userType"
                  value="buyer"
                  checked={formData.userType === 'buyer'}
                  onChange={handleChange}
                />
                <span className="radio-custom"></span>
                Buyer
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="userType"
                  value="seller"
                  checked={formData.userType === 'seller'}
                  onChange={handleChange}
                />
                <span className="radio-custom"></span>
                Seller
              </label>
            </div>
          </div>

          <div className="form-options">
            <label className="checkbox">
              <input type="checkbox" required />
              <span>I agree to the <a href="#terms">Terms of Service</a> and <a href="#privacy">Privacy Policy</a></span>
            </label>
          </div>

          <button type="submit" className="register-btn">
            Create Account
          </button>
        </form>

        <div className="divider">
          <span>or sign up with</span>
        </div>

        <div className="social-login">
          <button type="button" className="social-btn google-btn">
            <FontAwesomeIcon icon={faGoogle} className="social-icon" />
            Google
          </button>
          <button type="button" className="social-btn facebook-btn">
            <FontAwesomeIcon icon={faFacebookF} className="social-icon" />
            Facebook
          </button>
        </div>

        <div className="register-footer">
           <p>
            Already have an account?{' '}
             <button 
                onClick={() => onNavigate('login')} // This should already be there
              className="login-link"
              >
                Login
            </button>
            </p>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;