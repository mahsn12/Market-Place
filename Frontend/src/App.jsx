import React, { useState } from 'react'
import HomePage from './Pages/HomePage'
import MarketplaceLogin from './Pages/LoginPage'
import RegisterPage from './Pages/RegisterPage'
import SellerDashboard from './Pages/SellerDashboard'
import CheckoutPage from './Pages/CheckoutPage'
import OrdersPage from './Pages/OrdersPage'
import TopNav from './components/TopNav';
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
    


  const handleNavigation = (page) => {
    setCurrentPage(page)
    window.scrollTo(0, 0)
    localStorage.setItem("CurrentPage",page);
  }

  const handleLogin = (userData) => {
    setIsLoggedIn(true)
    setUser(userData)
    localStorage.setItem("User",JSON.stringify(userData));
    localStorage.setItem("isLoggedIn", true);

  }


  const handleLogout = () => {
    setIsLoggedIn(false)
    setUser(null)
     // Go back to home after logout
    localStorage.removeItem("User")
    localStorage.removeItem("isLoggedIn")
    localStorage.removeItem("token")
    handleNavigation('home')
  }

  const handleStartShopping = () => {
    if (!isLoggedIn) {
      handleNavigation('login') // Go to login if not logged in
    }
    // If already logged in, they can continue shopping on home page
  }

return (
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
            isLoggedIn={isLoggedIn}
            user={user}
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

        {isLoggedIn && user?.userType === 'buyer' && (
          <>
            {currentPage === 'checkout' && <CheckoutPage />}
            {currentPage === 'orders' && <OrdersPage />}
          </>
        )}

        {isLoggedIn && user?.userType === 'seller' &&
          currentPage === 'seller' && (
            <SellerDashboard />
          )}
      </main>
    </div>
  )
}

export default App