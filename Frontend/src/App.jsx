import React, { useState } from 'react'
import HomePage from './Pages/HomePage'
import MarketplaceLogin from './Pages/LoginPage'
import RegisterPage from './Pages/RegisterPage'
import SellerDashboard from './Pages/SellerDashboard'
import CheckoutPage from './Pages/CheckoutPage'
import OrdersPage from './Pages/OrdersPage'
import ProfilePage from './Pages/ProfilePage'
import TopNav from './components/TopNav';
import { ToastProvider } from './components/ToastContext';
import './App.css'

function App() {
    const [currentPage, setCurrentPage] = useState(
      localStorage.getItem("CurrentPage") || 'home'
    );

    const [isLoggedIn, setIsLoggedIn] = useState(
      localStorage.getItem("isLoggedIn") === "true"
    );

    const [user, setUser] = useState(
      JSON.parse(localStorage.getItem("User")) || null
    );
    const [searchQuery, setSearchQuery] = useState('');
    const [productsRefreshTrigger, setProductsRefreshTrigger] = useState(0);

  const handleNavigation = (page) => {
    console.log("Navigating to:", page);
    setCurrentPage(page);
    window.scrollTo(0, 0);
    localStorage.setItem("CurrentPage", page);
  }

  const handleLogin = (userData) => {
    setIsLoggedIn(true);
    setUser(userData);
    localStorage.setItem("User", JSON.stringify(userData));
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("token", userData.token || "");
    handleNavigation('home');
  }

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
    localStorage.removeItem("User");
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("token");
    handleNavigation('home');
  }

  const handleUserUpdate = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem("User", JSON.stringify(updatedUser));
  }

  const handleProductsRefresh = () => {
    setProductsRefreshTrigger(prev => prev + 1);
  }

  const handleStartShopping = () => {
    if (!isLoggedIn) {
      handleNavigation('login');
    } else {
      handleNavigation('home');
    }
  }

  // Add this function to handle seller dashboard navigation
  const handleGoToSellerDashboard = () => {
    console.log("Going to seller dashboard...");
    if (!isLoggedIn) {
      alert("Please login first to access seller dashboard");
      handleNavigation('login');
    } else {
      handleNavigation('seller');
    }
  }

  return (
    <ToastProvider>
      <div className="app-container">
        {/* show TopNav except login/register */}
        {currentPage !== 'login' && currentPage !== 'register' && (
          <TopNav
            isLoggedIn={isLoggedIn}
            user={user}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onNavigate={handleNavigation}
            onLogout={handleLogout}
          />
        )}

        <main className="main-content">
          {currentPage === 'home' && (
            <HomePage
              onNavigate={handleNavigation}
              onStartShopping={handleStartShopping}
              onGoToSellerDashboard={handleGoToSellerDashboard} // Pass the handler
              isLoggedIn={isLoggedIn}
              user={user}
              refreshTrigger={productsRefreshTrigger}
            />
          )}

          {currentPage === 'login' && (
            <MarketplaceLogin
              onNavigate={handleNavigation}
              onLogin={handleLogin}
            />
          )}

          {currentPage === 'register' && (
            <RegisterPage onNavigate={handleNavigation} />
          )}

          {/* Protected pages - only for logged in users */}
          {isLoggedIn && (
            <>
              {currentPage === 'checkout' && (
                <CheckoutPage
                  user={user}
                  onNavigate={handleNavigation}
                />
              )}
              {currentPage === 'orders' && (
                <OrdersPage
                  user={user}
                  onNavigate={handleNavigation}
                />
              )}
              {currentPage === 'profile' && (
                <ProfilePage
                  user={user}
                  onNavigate={handleNavigation}
                  onUserUpdate={handleUserUpdate}
                />
              )}
              {currentPage === 'seller' && (
                <SellerDashboard
                  user={user}
                  onNavigate={handleNavigation}
                  onProductsRefresh={handleProductsRefresh}
                />
              )}
            </>
          )}

          {/* If user tries to access protected page without login */}
          {!isLoggedIn && (currentPage === 'checkout' || currentPage === 'orders' || currentPage === 'seller') && (
            <div className="login-required">
              <h2>Login Required</h2>
              <p>Please login to access this page</p>
              <button
                onClick={() => handleNavigation('login')}
                className="btn-primary"
              >
                Go to Login
              </button>
            </div>
          )}
          {(!isLoggedIn && currentPage === 'profile') && (
            <div className="login-required">
              <h2>Login Required</h2>
              <p>Please login to access this page</p>
              <button
                onClick={() => handleNavigation('login')}
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

export default App
