import React, { useState } from 'react'
import HomePage from './Frontend/Pages/HomePage'
import MarketplaceLogin from './Frontend/Pages/LoginPage'
import RegisterPage from './Frontend/Pages/RegisterPage'
import SellerDashboard from './Frontend/Pages/SellerDashboard'
import CheckoutPage from './Frontend/Pages/CheckoutPage'
import OrdersPage from './Frontend/Pages/OrdersPage'
import './App.css'

function App() {
  const [currentPage, setCurrentPage] = useState('home') // Start with home page
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState(null)

  const handleNavigation = (page) => {
    setCurrentPage(page)
    window.scrollTo(0, 0)
  }

  const handleLogin = (userData) => {
    setIsLoggedIn(true)
    setUser(userData)
    
    // Navigate based on user type
    if (userData.userType === 'seller') {
      handleNavigation('seller')
    } else {
      handleNavigation('home') // Stay on home page for buyers
    }
  }

  const handleRegister = (userData) => {
    setIsLoggedIn(true)
    setUser(userData)
    
    // Navigate based on user type
    if (userData.userType === 'seller') {
      handleNavigation('seller')
    } else {
      handleNavigation('home') // Stay on home page for buyers
    }
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setUser(null)
    handleNavigation('home') // Go back to home after logout
  }

  const handleStartShopping = () => {
    if (!isLoggedIn) {
      handleNavigation('login') // Go to login if not logged in
    }
    // If already logged in, they can continue shopping on home page
  }

  return (
    <div className="app-container">
      {/* Show header for all pages except login/register */}
      {currentPage !== 'login' && currentPage !== 'register' && (
        <header className="app-header">
          <div className="header-content">
            <div className="logo" onClick={() => handleNavigation('home')}>
              Marketplace
            </div>
            <nav className="header-nav">
              {isLoggedIn ? (
                <>
                  {/* Buyer Navigation */}
                  {user?.userType === 'buyer' && (
                    <>
                      <button
                        onClick={() => handleNavigation('home')}
                        className={currentPage === 'home' ? 'nav-link active' : 'nav-link'}
                      >
                        Browse
                      </button>
                      <button
                        onClick={() => handleNavigation('checkout')}
                        className={currentPage === 'checkout' ? 'nav-link active' : 'nav-link'}
                      >
                        Cart
                      </button>
                      <button
                        onClick={() => handleNavigation('orders')}
                        className={currentPage === 'orders' ? 'nav-link active' : 'nav-link'}
                      >
                        Orders
                      </button>
                    </>
                  )}
                  
                  {/* Seller Navigation */}
                  {user?.userType === 'seller' && (
                    <button
                      onClick={() => handleNavigation('seller')}
                      className={currentPage === 'seller' ? 'nav-link active' : 'nav-link'}
                    >
                      Dashboard
                    </button>
                  )}
                  
                  <button onClick={handleLogout} className="nav-link">
                    Logout
                  </button>
                </>
              ) : (
                /* Navigation for non-logged in users */
                <>
                  <button
                    onClick={() => handleNavigation('home')}
                    className={currentPage === 'home' ? 'nav-link active' : 'nav-link'}
                  >
                    Home
                  </button>
                  <button
                    onClick={() => handleNavigation('login')}
                    className={currentPage === 'login' ? 'nav-link active' : 'nav-link'}
                  >
                    Login
                  </button>
                  <button
                    onClick={() => handleNavigation('register')}
                    className={currentPage === 'register' ? 'nav-link active' : 'nav-link'}
                  >
                    Register
                  </button>
                </>
              )}
            </nav>
          </div>
        </header>
      )}

      <main className="main-content">
        {/* Public Pages (accessible without login) */}
        {currentPage === 'home' && (
          <HomePage 
            onNavigate={handleNavigation} 
            onStartShopping={handleStartShopping}
            isLoggedIn={isLoggedIn}
            user={user}
          />
        )}
        
        {/* Authentication Pages */}
        {currentPage === 'login' && <MarketplaceLogin onNavigate={handleNavigation} onLogin={handleLogin} />}
        {currentPage === 'register' && <RegisterPage onNavigate={handleNavigation} onRegister={handleRegister} />}
        
        {/* Protected Buyer Pages (only if logged in as buyer) */}
        {isLoggedIn && user?.userType === 'buyer' && (
          <>
            {currentPage === 'checkout' && <CheckoutPage />}
            {currentPage === 'orders' && <OrdersPage />}
          </>
        )}
        
        {/* Protected Seller Pages (only if logged in as seller) */}
        {isLoggedIn && user?.userType === 'seller' && currentPage === 'seller' && (
          <SellerDashboard />
        )}
      </main>
    </div>
  )
}

export default App