import React, { useState } from 'react'
import HomePage from './Frontend/Pages/HomePage'
import CheckoutPage from './Frontend/Pages/CheckoutPage'
import OrdersPage from './Frontend/Pages/OrdersPage'
import SellerDashboard from './Frontend/Pages/SellerDashboard'
import './App.css'

function App() {
  const [currentPage, setCurrentPage] = useState('home')

  const handleNavigation = (page) => {
    setCurrentPage(page)
    window.scrollTo(0, 0)
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <div className="logo" onClick={() => handleNavigation('home')}>
            Marketplace
          </div>
          <nav className="header-nav">
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
            <button
              onClick={() => handleNavigation('seller')}
              className={currentPage === 'seller' ? 'nav-link active' : 'nav-link'}
            >
              Sell
            </button>
          </nav>
        </div>
      </header>

      {currentPage === 'home' && <HomePage onNavigate={handleNavigation} />}
      {currentPage === 'checkout' && <CheckoutPage />}
      {currentPage === 'orders' && <OrdersPage />}
      {currentPage === 'seller' && <SellerDashboard />}
    </div>
  )
}

export default App

