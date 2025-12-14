import React, { useState, useEffect } from "react";
import "../Style/OffersPage.css";
import { useToast } from "../components/ToastContext";
import {
  getBuyerOffers,
  getSellerOffers,
  acceptOffer,
  rejectOffer,
  counterOffer,
  acceptCounterOffer,
  withdrawOffer,
  getOfferStats,
} from "../apis/Offersapi";

export default function OffersPage({ user, isLoggedIn, onNavigate }) {
  const [activeTab, setActiveTab] = useState("received"); // received or sent
  const [offers, setOffers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [counterModal, setCounterModal] = useState(null);
  const [counterAmount, setCounterAmount] = useState("");
  const [counterMessage, setCounterMessage] = useState("");
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    if (isLoggedIn) {
      fetchOffers();
      if (activeTab === "received") {
        fetchStats();
      }
    }
  }, [isLoggedIn, activeTab]);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const response =
        activeTab === "received"
          ? await getSellerOffers()
          : await getBuyerOffers();
      setOffers(response.result || []);
    } catch (error) {
      console.error("Failed to fetch offers:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await getOfferStats();
      setStats(response.result);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const handleAcceptOffer = async (offerId) => {
    try {
      await acceptOffer(offerId);
      showSuccess("Offer accepted!");
      fetchOffers();
    } catch (error) {
      showError(error.message || "Failed to accept offer");
    }
  };

  const handleRejectOffer = async (offerId) => {
    try {
      await rejectOffer(offerId);
      showSuccess("Offer rejected");
      fetchOffers();
    } catch (error) {
      showError(error.message || "Failed to reject offer");
    }
  };

  const handleCounterOffer = async () => {
    if (!counterAmount || counterAmount <= 0) {
      showError("Please enter a valid counter amount");
      return;
    }

    try {
      await counterOffer(counterModal._id, counterAmount, counterMessage);
      showSuccess("Counter offer sent!");
      setCounterModal(null);
      setCounterAmount("");
      setCounterMessage("");
      fetchOffers();
    } catch (error) {
      showError(error.message || "Failed to send counter offer");
    }
  };

  const handleAcceptCounterOffer = async (offerId) => {
    try {
      await acceptCounterOffer(offerId);
      showSuccess("Counter offer accepted!");
      fetchOffers();
    } catch (error) {
      showError(error.message || "Failed to accept counter offer");
    }
  };

  const handleWithdrawOffer = async (offerId) => {
    try {
      await withdrawOffer(offerId);
      showSuccess("Offer withdrawn");
      fetchOffers();
    } catch (error) {
      showError(error.message || "Failed to withdraw offer");
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { class: "status-pending", text: "⏳ Pending" },
      accepted: { class: "status-accepted", text: "✅ Accepted" },
      rejected: { class: "status-rejected", text: "❌ Rejected" },
      countered: { class: "status-countered", text: "🔄 Countered" },
      withdrawn: { class: "status-withdrawn", text: "↩️ Withdrawn" },
    };
    return badges[status] || badges.pending;
  };

  if (!isLoggedIn) {
    return (
      <div className="offers-page">
        <div className="empty-state">
          <h2>💰 Offers</h2>
          <p>Please log in to view your offers</p>
        </div>
      </div>
    );
  }

  return (
    <div className="offers-page">
      <div className="offers-header">
        <h1>💰 Offers & Negotiations</h1>
        <p>Manage your price negotiations</p>
      </div>

      {/* Stats - Only show for received offers */}
      {activeTab === "received" && stats && (
        <div className="offers-stats">
          <div className="stat-card">
            <span className="stat-value">{stats.pending}</span>
            <span className="stat-label">Pending</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{stats.accepted}</span>
            <span className="stat-label">Accepted</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{stats.countered}</span>
            <span className="stat-label">Countered</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="offers-tabs">
        <button
          className={`tab ${activeTab === "received" ? "active" : ""}`}
          onClick={() => setActiveTab("received")}
        >
          📥 Received Offers
        </button>
        <button
          className={`tab ${activeTab === "sent" ? "active" : ""}`}
          onClick={() => setActiveTab("sent")}
        >
          📤 Sent Offers
        </button>
      </div>

      {/* Offers List */}
      <div className="offers-list">
        {loading ? (
          <div className="loading">Loading offers...</div>
        ) : offers.length === 0 ? (
          <div className="empty-state">
            <p>No {activeTab === "received" ? "received" : "sent"} offers yet</p>
          </div>
        ) : (
          offers.map((offer) => (
            <div key={offer._id} className="offer-card">
              <div className="offer-header">
                <div className="offer-post-info">
                  <img
                    src={offer.postId?.images?.[0] || "/placeholder.png"}
                    alt={offer.postId?.title}
                    className="post-thumbnail"
                  />
                  <div>
                    <h3>{offer.postId?.title}</h3>
                    <p className="original-price">
                      Original: {formatPrice(offer.originalPrice)}
                    </p>
                  </div>
                </div>
                <span className={`status-badge ${getStatusBadge(offer.status).class}`}>
                  {getStatusBadge(offer.status).text}
                </span>
              </div>

              <div className="offer-details">
                <div className="offer-user">
                  <div className="user-avatar">
                    {activeTab === "received"
                      ? offer.buyerId?.profileImage
                        ? <img src={offer.buyerId.profileImage} alt={offer.buyerId.name} />
                        : <span>{offer.buyerId?.name?.charAt(0).toUpperCase()}</span>
                      : offer.sellerId?.profileImage
                        ? <img src={offer.sellerId.profileImage} alt={offer.sellerId.name} />
                        : <span>{offer.sellerId?.name?.charAt(0).toUpperCase()}</span>
                    }
                  </div>
                  <div>
                    <h4>
                      {activeTab === "received"
                        ? offer.buyerId?.name
                        : offer.sellerId?.name}
                    </h4>
                    <p className="offer-date">
                      {new Date(offer.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="offer-amounts">
                  <div className="amount-item">
                    <span className="amount-label">Offered:</span>
                    <span className="amount-value">{formatPrice(offer.offerAmount)}</span>
                  </div>
                  {offer.counterOffer && (
                    <div className="amount-item counter">
                      <span className="amount-label">Counter:</span>
                      <span className="amount-value">
                        {formatPrice(offer.counterOffer.amount)}
                      </span>
                    </div>
                  )}
                </div>

                {offer.message && (
                  <div className="offer-message">
                    <p>💬 "{offer.message}"</p>
                  </div>
                )}

                {offer.counterOffer?.message && (
                  <div className="offer-message counter">
                    <p>🔄 Counter: "{offer.counterOffer.message}"</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="offer-actions">
                {activeTab === "received" && offer.status === "pending" && (
                  <>
                    <button
                      className="btn-accept"
                      onClick={() => handleAcceptOffer(offer._id)}
                    >
                      ✓ Accept
                    </button>
                    <button
                      className="btn-counter"
                      onClick={() => setCounterModal(offer)}
                    >
                      🔄 Counter
                    </button>
                    <button
                      className="btn-reject"
                      onClick={() => handleRejectOffer(offer._id)}
                    >
                      ✕ Reject
                    </button>
                  </>
                )}

                {activeTab === "sent" && offer.status === "pending" && (
                  <button
                    className="btn-withdraw"
                    onClick={() => handleWithdrawOffer(offer._id)}
                  >
                    ↩️ Withdraw
                  </button>
                )}

                {activeTab === "sent" && offer.status === "countered" && (
                  <>
                    <button
                      className="btn-accept"
                      onClick={() => handleAcceptCounterOffer(offer._id)}
                    >
                      ✓ Accept Counter
                    </button>
                    <button
                      className="btn-withdraw"
                      onClick={() => handleWithdrawOffer(offer._id)}
                    >
                      ↩️ Withdraw
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Counter Offer Modal */}
      {counterModal && (
        <div className="modal-overlay" onClick={() => setCounterModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>🔄 Counter Offer</h2>
            <p>Original offer: {formatPrice(counterModal.offerAmount)}</p>
            <div className="form-group">
              <label>Counter Amount</label>
              <input
                type="number"
                value={counterAmount}
                onChange={(e) => setCounterAmount(e.target.value)}
                placeholder="Enter counter amount"
                min="0"
                step="0.01"
              />
            </div>
            <div className="form-group">
              <label>Message (optional)</label>
              <textarea
                value={counterMessage}
                onChange={(e) => setCounterMessage(e.target.value)}
                placeholder="Add a message to your counter offer"
                rows="3"
              />
            </div>
            <div className="modal-actions">
              <button className="btn-primary" onClick={handleCounterOffer}>
                Send Counter Offer
              </button>
              <button
                className="btn-secondary"
                onClick={() => setCounterModal(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
