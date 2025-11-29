import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate, Link } from "react-router-dom";
import HomePage from "./Frontend/Pages/HomePage";
import ProductPage from "./Frontend/Pages/ProductPage";
import MarketplaceLogin from "./Frontend/Pages/LoginPage";
import RegisterPage from "./Frontend/Pages/RegisterPage";
import SellerDashboard from "./Frontend/Pages/SellerDashboard";
import CheckoutPage from "./Frontend/Pages/CheckoutPage";
import OrdersPage from "./Frontend/Pages/OrdersPage";
import "./App.css";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  // ----- Auth Handlers -----

  const handleLogin = (userData, navigate) => {
    setIsLoggedIn(true);
    setUser(userData);

    if (userData.userType === "seller") {
      navigate("/seller");
    } else {
      navigate("/");
    }
  };

  const handleRegister = (userData, navigate) => {
    setIsLoggedIn(true);
    setUser(userData);

    if (userData.userType === "seller") {
      navigate("/seller");
    } else {
      navigate("/");
    }
  };

  const handleLogout = (navigate) => {
    setIsLoggedIn(false);
    setUser(null);
    navigate("/");
  };

  const handleStartShopping = (navigate) => {
    if (!isLoggedIn) {
      navigate("/login");
    }
  };

  return (
    <Router>
      <Header isLoggedIn={isLoggedIn} user={user} onLogout={handleLogout} />
      <main className="main-content">
        <Routes>
          {/* Public pages */}
          <Route
            path="/"
            element={
              <HomePage
                onStartShopping={(navigate) => handleStartShopping(navigate)}
                isLoggedIn={isLoggedIn}
                user={user}
              />
            }
          />
          <Route
            path="/product/:id"
            element={<ProductPage isLoggedIn={isLoggedIn} user={user} />}
          />
          <Route
            path="/login"
            element={<AuthWrapper component="login" onLogin={handleLogin} />}
          />
          <Route
            path="/register"
            element={<AuthWrapper component="register" onRegister={handleRegister} />}
          />

          {/* Buyer pages */}
          {isLoggedIn && user?.userType === "buyer" && (
            <>
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/orders" element={<OrdersPage />} />
            </>
          )}

          {/* Seller pages */}
          {isLoggedIn && user?.userType === "seller" && (
            <Route path="/seller" element={<SellerDashboard />} />
          )}

          {/* Fallback */}
          <Route path="*" element={<div style={{ padding: "2rem" }}>404 Not Found</div>} />
        </Routes>
      </main>
    </Router>
  );
}

/* ---------------------- HEADER COMPONENT ---------------------- */
function Header({ isLoggedIn, user, onLogout }) {
  const navigate = useNavigate();

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="logo" onClick={() => navigate("/")}>
          Marketplace
        </div>

        <nav className="header-nav">
          {isLoggedIn ? (
            <>
              {/* Buyer Navigation */}
              {user?.userType === "buyer" && (
                <>
                  <Link to="/" className="nav-link">
                    Browse
                  </Link>
                  <Link to="/checkout" className="nav-link">
                    Cart
                  </Link>
                  <Link to="/orders" className="nav-link">
                    Orders
                  </Link>
                </>
              )}

              {/* Seller Navigation */}
              {user?.userType === "seller" && (
                <Link to="/seller" className="nav-link">
                  Dashboard
                </Link>
              )}

              <button
                onClick={() => onLogout(navigate)}
                className="nav-link"
                style={{ background: "none", border: "none", cursor: "pointer" }}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/" className="nav-link">
                Home
              </Link>
              <Link to="/login" className="nav-link">
                Login
              </Link>
              <Link to="/register" className="nav-link">
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

/* ---------------------- AUTH WRAPPER ---------------------- */
function AuthWrapper({ component, onLogin, onRegister }) {
  const navigate = useNavigate();

  if (component === "login") {
    return <MarketplaceLogin onLogin={(u) => onLogin(u, navigate)} onNavigate={navigate} />;
  } else {
    return <RegisterPage onRegister={(u) => onRegister(u, navigate)} onNavigate={navigate} />;
  }
}

export default App;