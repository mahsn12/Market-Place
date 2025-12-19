import React, { useState, useEffect } from "react";
import "../Style/HomePage.css";
import { getUnreadCount } from "../apis/Messagesapi";

export default function TopNavbar({
  isLoggedIn,
  user,
  onNavigate,
  onLogout,
  onSearch,
}) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (isLoggedIn) {
      const fetchUnreadCount = async () => {
        try {
          const response = await getUnreadCount();
          setUnreadCount(response.result?.totalUnread || 0);
        } catch (error) {
          console.error("Failed to fetch unread count:", error);
        }
      };

      fetchUnreadCount();

      // Poll every 5 seconds
      const interval = setInterval(fetchUnreadCount, 5000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onSearch && searchQuery.trim()) {
      onSearch(searchQuery.trim());
    }
  };

const handleSearchChange = (e) => {
  setSearchQuery(e.target.value);
};


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

      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="search-form">
        <input
          type="text"
          className="search-input"
          placeholder="Search by title, description, or seller..."
          value={searchQuery}
          onChange={handleSearchChange}
        />
        <button type="submit" className="search-button">
          🔍
        </button>
      </form>

      {/* icons section - all buttons on the right */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        {isLoggedIn && (
          <>
            {/* My Listings Button */}
            <button
              className="nav-button listings-button"
              onClick={() => onNavigate("my-listings")}
              title="My Listings Dashboard"
            >
              📊 My Listings
            </button>

            {/* Offers Button */}
            <button
              className="nav-button offers-button"
              onClick={() => onNavigate("offers")}
              title="View Offers"
            >
              💰 Offers
            </button>
                {/* Cart Button */}
          <button
            className="nav-button cart-button"
            onClick={() => onNavigate("cart")}
            title="View Cart"
          >
            🛒 Cart
          </button>
            {/* Messages Button */}
            <button
              className="nav-button messages-button"
              onClick={() => onNavigate("messages")}
              title="View Messages"
              style={{ position: "relative" }}
            >
              💬 Messages
              {unreadCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: "-8px",
                    right: "-8px",
                    background: "#ff4757",
                    color: "white",
                    borderRadius: "50%",
                    width: "20px",
                    height: "20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "11px",
                    fontWeight: "600",
                  }}
                >
                  {unreadCount}
                </span>
              )}
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
