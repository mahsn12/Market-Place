import React from "react";
import "../Style/Navbar.css";

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-content">
        <div className="navbar-logo">MarketPlace</div>
        <ul className="navbar-menu">
          <li>
            <a href="#home">Home</a>
          </li>
          <li>
            <a href="#products">Products</a>
          </li>
          <li>
            <a href="#cart">Cart</a>
          </li>
          <li>
            <a href="#account">Account</a>
          </li>
        </ul>
      </div>
    </nav>
  );
}
