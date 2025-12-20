import React, { useState } from "react";
import HomePage from "./Pages/HomePage";
import MarketplaceLogin from "./Pages/LoginPage";
import RegisterPage from "./Pages/RegisterPage";
import CreatePostPage from "./Pages/CreatePostPage";
import PostDetailsPage from "./Pages/PostDetailsPage";
import ProfilePage from "./Pages/ProfilePage";
import MessagesPage from "./Pages/MessagesPage";
import OffersPage from "./Pages/OffersPage";
import MyListingsPage from "./Pages/MyListingsPage";
import TopNav from "./components/TopNav";
import { ToastProvider } from "./components/ToastContext";
import "./App.css";
import CartPage from "./Pages/CartPage"; 
import SearchResultsPage from "./Pages/SearchResultsPage";
import CheckoutPage from "./Pages/CheckOutPage";

function App() {
  const [currentPage, setCurrentPage] = useState(
    localStorage.getItem("CurrentPage") || "home"
  );

  const [selectedPost, setSelectedPost] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(
    localStorage.getItem("isLoggedIn") === "true"
  );

  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("User")) || null
  );
  const [searchQuery, setSearchQuery] = useState("");

  const handleNavigation = (page, params = null) => {
    console.log("Navigating to:", page, params);
    setCurrentPage(page);
    if (params?.post) {
      setSelectedPost(params.post);
    }
    window.scrollTo(0, 0);
    localStorage.setItem("CurrentPage", page);
  };

  const handleLogin = (userData) => {
    setIsLoggedIn(true);
    setUser(userData);
    localStorage.setItem("User", JSON.stringify(userData));
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("token", userData.token || "");
    handleNavigation("home");
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
    localStorage.removeItem("User");
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("token");
    handleNavigation("home");
  };

  const handleUserUpdate = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem("User", JSON.stringify(updatedUser));
  };

  const handleStartShopping = () => {
    if (!isLoggedIn) {
      handleNavigation("login");
    } else {
      handleNavigation("home");
    }
  };

const handleSearch = (query) => {
  if (!query.trim()) return;

  setSearchQuery(query);
  handleNavigation("search");
};


  return (
    <ToastProvider>
      <div className="app-container">
        {/* show TopNav except login/register */}
        {currentPage !== "login" && currentPage !== "register" && (
          <TopNav
            isLoggedIn={isLoggedIn}
            user={user}
            onNavigate={handleNavigation}
            onLogout={handleLogout}
            onSearch={handleSearch}
          />
        )}

        <main className="main-content">
          {currentPage === "home" && (
            <HomePage
              onNavigate={handleNavigation}
              onStartShopping={handleStartShopping}
              isLoggedIn={isLoggedIn}
              user={user}
              searchQuery={searchQuery || ""}
            />
          )}

          {currentPage === "search" && (
          <SearchResultsPage
            query={searchQuery}
            onNavigate={handleNavigation}
          />
        )}

          {currentPage === "login" && (
            <MarketplaceLogin
              onNavigate={handleNavigation}
              onLogin={handleLogin}
            />
          )}

          {currentPage === "register" && (
            <RegisterPage onNavigate={handleNavigation} />
          )}

            {/* Protected pages - only for logged in users */}
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
                <MessagesPage
                  user={user}
                  isLoggedIn={isLoggedIn}
                />
              )}

              {currentPage === "offers" && (
                <OffersPage
                  user={user}
                  isLoggedIn={isLoggedIn}
                  onNavigate={handleNavigation}
                />
              )}

              {currentPage === "my-listings" && (
                <MyListingsPage
                  user={user}
                  isLoggedIn={isLoggedIn}
                  onNavigate={handleNavigation}
                />
              )}

              {/* ✅ CART PAGE GOES HERE */}
              {currentPage === "cart" && (
                <CartPage
                  onNavigate={handleNavigation}
                  isLoggedIn={isLoggedIn}
                />
              )}
            </>
          )}


          {!isLoggedIn && currentPage === "post-details" && (
            <PostDetailsPage
              post={selectedPost}
              onNavigate={handleNavigation}
              user={user}
              isLoggedIn={isLoggedIn}
            />
          )}

          {/* If user tries to access protected page without login */}
          {!isLoggedIn &&
            (currentPage === "create-post" ||
              currentPage === "my-listings" ||
              currentPage === "messages" ||
              currentPage === "offers") && (
              <div className="login-required">
                <h2>Login Required</h2>
                <p>Please login to access this page</p>
                <button
                  onClick={() => handleNavigation("login")}
                  className="btn-primary"
                >
                  Go to Login
                </button>
              </div>
            )}
          {!isLoggedIn && currentPage === "profile" && (
            <div className="login-required">
              <h2>Login Required</h2>
              <p>Please login to access this page</p>
              <button
                onClick={() => handleNavigation("login")}
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