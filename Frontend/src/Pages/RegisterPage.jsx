import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGoogle, faFacebookF } from '@fortawesome/free-brands-svg-icons';
import '../Style/RegisterPage.css';

// IMPORT THE API
import { registerUser } from "../apis/Userapi";
import { useToast } from '../components/ToastContext';

function RegisterPage({ onNavigate }) {
  const { showSuccess, showError } = useToast();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '' // NEW FIELD
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      showError("Passwords don't match!");
      return;
    }

    try {
      const res = await registerUser({
        name: `${formData.firstName} ${formData.lastName}`,  // COMBINE NAMES
        email: formData.email,
        password: formData.password,
        role: formData.userType,   // BACKEND WANTS "role"
        phone: formData.phone      // SEND PHONE
      });

      showSuccess("Registration successful!");

      if (onNavigate) onNavigate("login");

    } catch (err) {
      showError("Registration failed: " + err.message);
    }
  };

  return (
    <div className="marketplace-register-container">
      <div className="register-box">
        <div className="register-brand">
          <span className="brand-dot" aria-hidden="true"></span>
          <span className="brand-name">Marketplace</span>
          <span className="brand-pill">Secure</span>
        </div>
        <div className="register-header">
          <h2>Create your account</h2>
          <p>Shop confidently or start selling with a secure profile.</p>
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

          {/* PHONE INPUT */}
          <div className="input-group">
            <label>Phone Number</label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              className="form-input"
              placeholder="Enter your phone number"
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

          <div className="form-options">
            <label className="checkbox">
              <input type="checkbox" required />
              <span>I agree to the <a href="#terms">Terms of Service</a> and <a href="#privacy">Privacy Policy</a></span>
            </label>
          </div>

          <button type="submit" className="register-btn">
            Create Account
          </button>
          <p className="helper-text">We’ll verify your email and phone for account security.</p>
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
              onClick={() => onNavigate('login')}
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
