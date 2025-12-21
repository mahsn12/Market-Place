import React from "react";
import "../Style/Footer.css";

export default function Footer({ onCreateListing }) {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3>About Us</h3>
          <p>
            Your trusted marketplace for quality products and exceptional
            service.
          </p>
        </div>
        <div className="footer-section">
          <h3>Quick Links</h3>
          <ul>
            <li>
              <a href="#home">Home</a>
            </li>
            <li>
              <a href="#products">Products</a>
            </li>
            <li>
              {onCreateListing ? (
                <a
                  href="#sell"
                  onClick={(e) => {
                    e.preventDefault();
                    onCreateListing();
                  }}
                >
                  Create Listing
                </a>
              ) : (
                <a href="#sell">Create Listing</a>
              )}
            </li>
          </ul>
        </div>
        <div className="footer-section">
          <h3>Contact</h3>
          <p>Email: info@marketplace.com</p>
          <p>Phone: (123) 456-7890</p>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; 2025 MarketPlace. All rights reserved.</p>
      </div>
    </footer>
  );
}
