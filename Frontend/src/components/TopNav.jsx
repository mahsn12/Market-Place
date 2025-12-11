import React from "react";
import "../Style/HomePage.css";

export default function TopNavbar({
  isLoggedIn,
  user,
  searchQuery,
  setSearchQuery,
  onNavigate,
  onLogout,
}) {
  return (
    <div className="home-top-nav">
      {/* Brand link back to homepage */}
      <div
        className="home-brand"
        role="link"
        tabIndex={0}
        onClick={() => onNavigate("home")}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onNavigate("home");
        }}
        title="Go to homepage"
      >
        Marketplace
      </div>

      {/* icons section - all buttons on the right */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        {isLoggedIn && (
          <>
            {/* Cart Button */}
            <button
              className="nav-button cart-button"
              onClick={() => onNavigate("checkout")}
              title="View Cart"
            >
              🛒 Cart
            </button>

            {/* Orders Button */}
            <button
              className="nav-button orders-button"
              onClick={() => onNavigate("orders")}
              title="View Orders"
            >
              📦 Orders
            </button>
          </>
        )}

        {!isLoggedIn && (
          <>
            <button className="nav-link" onClick={() => onNavigate("login")}>
              Login
            </button>

            <button
              className="nav-link register"
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

            {/* Single logout button */}
            <button
              className="nav-button logout-button"
              onClick={onLogout}
              title="Logout"
            >
              Logout
            </button>
          </>
        )}
      </div>
    </div>
  );
}
