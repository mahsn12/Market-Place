import React, { useState, useEffect, useRef } from "react";
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

  // debounce timer ref
  const searchTimeoutRef = useRef(null);

  /* =======================
     Unread messages polling
     ======================= */
  useEffect(() => {
    if (!isLoggedIn) return;

    const fetchUnreadCount = async () => {
      try {
        const response = await getUnreadCount();
        setUnreadCount(response.result?.totalUnread || 0);
      } catch (error) {
        console.error("Failed to fetch unread count:", error);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 5000);

    return () => clearInterval(interval);
  }, [isLoggedIn]);

  /* =======================
     Search handlers
     ======================= */

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (!onSearch) return;

    // clear previous debounce
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // debounce search
    searchTimeoutRef.current = setTimeout(() => {
      if (value.trim()) {
        onSearch(value.trim()); // search with partial letters
      } else {
        onSearch(""); // 🔥 clear products when input is empty
      }
    }, 400);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery.trim());
    }
  };

  /* =======================
     JSX
     ======================= */
  return (
    <div className="home-top-nav">
      {/* Brand */}
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

      {/* Right-side buttons */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        {isLoggedIn && (
          <>
            <button
              className="nav-button listings-button"
              onClick={() => onNavigate("my-listings")}
            >
              📊 My Listings
            </button>

            <button
              className="nav-button offers-button"
              onClick={() => onNavigate("offers")}
            >
              💰 Offers
            </button>

            <button
              className="nav-button orders-button"
              onClick={() => onNavigate("orders")}
            >
              🧾 Orders
            </button>

            <button
              className="nav-button cart-button"
              onClick={() => onNavigate("cart")}
            >
              🛒 Cart
            </button>

            <button
              className="nav-button messages-button"
              onClick={() => onNavigate("messages")}
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
              src={user.profileImage}
              alt="profile"
              className="home-profile"
              onClick={() => onNavigate("profile")}
            />

            <button
              className="nav-button logout-button"
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
