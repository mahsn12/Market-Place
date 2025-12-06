import React from "react";
import "../Style/HomePage.css";

export default function TopNavbar({
  isLoggedIn,
  user,
  searchQuery,
  setSearchQuery,
  onNavigate,
  onLogout
}) {
  return (
    <div className="home-top-nav">

      <div className="home-search-wrapper">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          className="search-input"
          placeholder="Search for products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* icons section */}
      <div style={{ display: "flex", alignItems: "center" }}>
        
        {isLoggedIn && (
          <>
            {/* Wishlist */}
            <span
              style={{ fontSize: "1.3rem", marginLeft: "1rem", cursor: "pointer" }}
              onClick={() => onNavigate("wishlist")}
            >
              ❤️
            </span>

            {/* Cart */}
            <span
              style={{ fontSize: "1.3rem", marginLeft: "1rem", cursor: "pointer" }}
              onClick={() => onNavigate("checkout")}
            >
              🛒
            </span>

            {/* Orders */}
            <span
              style={{ fontSize: "1.3rem", marginLeft: "1rem", cursor: "pointer" }}
              onClick={() => onNavigate("orders")}
            >
              📦
            </span>
          </>
        )}

        {!isLoggedIn && (
          <>
            <button
              style={{ marginLeft: "1rem" }}
              className="nav-link"
              onClick={() => onNavigate("login")}
            >
              Login
            </button>

            <button
              style={{ marginLeft: "1rem" }}
              className="nav-link"
              onClick={() => onNavigate("register")}
            >
              Register
            </button>
          </>
        )}

        {isLoggedIn && user && (
          <>
            <img
              onClick={() => onNavigate("profile")}
              src={user.profileImage}
              alt="profile"
              className="home-profile"
            />

            <button
              style={{ marginLeft: "1rem" }}
              className="nav-link"
              onClick={onLogout}
            >
              Logout
            </button>
          </>
        )}

      </div>
    </div>
  );
}
