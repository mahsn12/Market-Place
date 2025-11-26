import React, { useState } from 'react'
import CheckoutPage from './Frontend/Pages/CheckoutPage'
import OrdersPage from './Frontend/Pages/OrdersPage'
import SellerDashboard from './Frontend/Pages/SellerDashboard'
import './App.css'

function App() {
  const [currentPage, setCurrentPage] = useState('checkout')

  return (
    <div className="app-container">
      <nav className="app-nav">
        <div className="nav-buttons">
          <button
            onClick={() => setCurrentPage('checkout')}
            className={currentPage === 'checkout' ? 'nav-btn active' : 'nav-btn'}
          >
            Checkout
          </button>
          <button
            onClick={() => setCurrentPage('orders')}
            className={currentPage === 'orders' ? 'nav-btn active' : 'nav-btn'}
          >
            Orders
          </button>
          <button
            onClick={() => setCurrentPage('seller')}
            className={currentPage === 'seller' ? 'nav-btn active' : 'nav-btn'}
          >
            Seller Dashboard
          </button>
        </div>
      </nav>

      {currentPage === 'checkout' && <CheckoutPage />}
      {currentPage === 'orders' && <OrdersPage />}
      {currentPage === 'seller' && <SellerDashboard />}
    </div>
  )
}

export default App

