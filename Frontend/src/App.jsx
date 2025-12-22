import React, { useState, useEffect } from "react";
import HomePage from "./Pages/HomePage";
import MarketplaceLogin from "./Pages/LoginPage";
import RegisterPage from "./Pages/RegisterPage";
import CreatePostPage from "./Pages/CreatePostPage";
import PostDetailsPage from "./Pages/PostDetailsPage";
import OrdersPage from "./Pages/OrdersPage";
import OrderDetailsPage from "./Pages/OrderDetailsPage";
import ProfilePage from "./Pages/ProfilePage";
import MessagesPage from "./Pages/MessagesPage";
import MyListingsPage from "./Pages/MyListingsPage";
import TopNav from "./components/TopNav";
import { ToastProvider } from "./components/ToastContext";
import "./App.css";
import CartPage from "./Pages/CartPage";
import SearchResultsPage from "./Pages/SearchResultsPage";
import CheckoutPage from "./Pages/CheckOutPage";

/* ✅ ADMIN */
import AdminPage from "./Pages/AdminPage";

function App() {
  /* =========================
     STATE
  ========================= */

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("User"));
    } catch {
      return null;
    }
  });

  const [isLoggedIn, setIsLoggedIn] = useState(
    localStorage.getItem("isLoggedIn") === "true"
  );

  const [currentPage, setCurrentPage] = useState(
    localStorage.getItem("CurrentPage") || "home"
  );

  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const isAdmin = user?.isAdmin === true;

  /* =========================
     🔥 FIX (CRITICAL)
     Force admin page AFTER state rehydration
     This solves the "always goes home" bug
  ========================= */
  useEffect(() => {
    if (isLoggedIn && isAdmin && currentPage === "home") {
      setCurrentPage("admin");
      localStorage.setItem("CurrentPage", "admin");
    }
  }, [isLoggedIn, isAdmin, currentPage]);

  /* =========================
     KEEP STATE IN SYNC
  ========================= */

  useEffect(() => {
    localStorage.setItem("CurrentPage", currentPage);
  }, [currentPage]);

  useEffect(() => {
    if (user) {
      localStorage.setItem("User", JSON.stringify(user));
    }
  }, [user]);

  /* =========================
     NAVIGATION
  ========================= */

  const handleNavigation = (page, params = null) => {
    setCurrentPage(page);

    if (params?.post) setSelectedPost(params.post);
    if (params?.order) setSelectedOrder(params.order);

    window.scrollTo(0, 0);
  };

  /* =========================
     LOGIN / LOGOUT
  ========================= */

  const handleLogin = (userData) => {
    setIsLoggedIn(true);
    setUser(userData);

    localStorage.setItem("User", JSON.stringify(userData));
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("token", userData.token || "");

    if (userData.isAdmin === true) {
      localStorage.setItem("CurrentPage", "admin");
      setCurrentPage("admin");
    } else {
      localStorage.setItem("CurrentPage", "home");
      setCurrentPage("home");
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);

    localStorage.removeItem("User");
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("token");
    localStorage.removeItem("CurrentPage");

    setCurrentPage("home");
  };

  /* =========================
     HELPERS
  ========================= */

  const handleUserUpdate = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem("User", JSON.stringify(updatedUser));
  };

  const handleStartShopping = () => {
    if (!isLoggedIn) {
      setCurrentPage("login");
    } else {
      setCurrentPage("home");
    }
  };

  const handleSearch = (query) => {
    if (!query.trim()) return;
    setSearchQuery(query);
    setCurrentPage("search");
  };

  /* =========================
     RENDER
  ========================= */

  return (
    <ToastProvider>
      <div className="app-container">
        {currentPage !== "login" && currentPage !== "register" && (
          <TopNav
            isLoggedIn={isLoggedIn}
            user={user}
            onNavigate={handleNavigation}
            onLogout={handleLogout}
            onSearch={handleSearch}
            isAdmin={isAdmin}
          />
        )}

        <main className="main-content">
          {/* HOME */}
          {currentPage === "home" && (
            <HomePage
              onNavigate={handleNavigation}
              onStartShopping={handleStartShopping}
              isLoggedIn={isLoggedIn}
              user={user}
              searchQuery={searchQuery}
            />
          )}

          {/* ADMIN */}
          {currentPage === "admin" && isAdmin && (
            <AdminPage user={user} onNavigate={handleNavigation} />
          )}

          {currentPage === "admin" && !isAdmin && (
            <div className="login-required">
              <h2>Access Denied</h2>
              <p>Admins only</p>
            </div>
          )}

          {/* SEARCH */}
          {currentPage === "search" && (
            <SearchResultsPage
              query={searchQuery}
              onNavigate={handleNavigation}
            />
          )}

          {/* AUTH */}
          {currentPage === "login" && (
            <MarketplaceLogin
              onNavigate={handleNavigation}
              onLogin={handleLogin}
            />
          )}

          {currentPage === "register" && (
            <RegisterPage onNavigate={handleNavigation} />
          )}

          {/* LOGGED IN PAGES */}
          {isLoggedIn && (
            <>
              {currentPage === "create-post" && (
                <CreatePostPage
                  user={user}
                  isLoggedIn={isLoggedIn}
                  onNavigate={handleNavigation}
                />
              )}

              {currentPage === "post-details" && selectedPost && (
                <PostDetailsPage
                  post={selectedPost}
                  onNavigate={handleNavigation}
                  user={user}
                  isLoggedIn={isLoggedIn}
                />
              )}

              {currentPage === "orders" && (
                <OrdersPage user={user} onNavigate={handleNavigation} />
              )}

              {currentPage === "order-details" && selectedOrder && (
                <OrderDetailsPage
                  order={selectedOrder}
                  onNavigate={handleNavigation}
                />
              )}

              {currentPage === "profile" && (
                <ProfilePage
                  user={user}
                  onNavigate={handleNavigation}
                  onUserUpdate={handleUserUpdate}
                />
              )}

              {currentPage === "checkout" && (
                <CheckoutPage
                  onNavigate={handleNavigation}
                  user={user}
                />
              )}

              {currentPage === "messages" && (
                <MessagesPage user={user} isLoggedIn={isLoggedIn} />
              )}

              {currentPage === "my-listings" && (
                <MyListingsPage
                  user={user}
                  isLoggedIn={isLoggedIn}
                  onNavigate={handleNavigation}
                />
              )}

              {currentPage === "cart" && (
                <CartPage
                  onNavigate={handleNavigation}
                  isLoggedIn={isLoggedIn}
                />
              )}
            </>
          )}

          {/* GUEST ACCESS BLOCK */}
          {!isLoggedIn &&
            ["create-post", "my-listings", "messages", "profile"].includes(
              currentPage
            ) && (
              <div className="login-required">
                <h2>Login Required</h2>
                <p>Please login to access this page</p>
                <button
                  onClick={() => setCurrentPage("login")}
                  className="btn-primary"
                >
                  Go to Login
                </button>
              </div>
            )}
        </main>
      </div>
    </ToastProvider>
  );
}

export default App;
