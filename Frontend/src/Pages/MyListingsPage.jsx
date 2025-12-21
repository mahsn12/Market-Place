import React, { useState, useEffect } from "react";
import "../Style/MyListingsPage.css";
import { useToast } from "../components/ToastContext";
import { deletePost, getPostsBySeller, getSellerProfile } from "../apis/Postsapi";

export default function MyListingsPage({ user, isLoggedIn, onNavigate }) {
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    if (isLoggedIn && user) {
      console.log("Current user object:", user);
      console.log("User ID:", user._id);
      fetchAllData();
    }
  }, [isLoggedIn, user]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchPosts(), fetchSellerStats()]);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    try {
      const userId = user._id || user.id;
      console.log("Fetching posts for seller:", userId);
      const response = await getPostsBySeller(userId);
      console.log("Posts response:", response);
      setPosts(response.result || []);
    } catch (error) {
      console.error("Failed to fetch posts:", error);
      showError(`Failed to load listings: ${error.message}`);
    }
  };

  const fetchSellerStats = async () => {
    try {
      const userId = user._id || user.id;
      console.log("Fetching seller stats for:", userId);
      const response = await getSellerProfile(userId);
      console.log("Stats response:", response);
      setStats(response.stats || null);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this listing?")) {
      return;
    }

    try {
      await deletePost(postId);
      showSuccess("Listing deleted successfully");
      fetchPosts();
    } catch (error) {
      showError(error.message || "Failed to delete listing");
    }
  };

  const handleEditPost = (post) => {
    onNavigate("create-post", { editPost: post });
  };

  const getPostAnalytics = (post) => {
    return {
      views: 0, // Placeholder - would need to implement view tracking
      likes: post.likes?.length || 0,
      comments: post.comments?.length || 0,
      offers: 0,
      pendingOffers: 0,
      acceptedOffers: 0,
    };
  };

  const getTotalAnalytics = () => {
    const totalLikes = posts.reduce((sum, p) => sum + (p.likes?.length || 0), 0);
    const totalComments = posts.reduce((sum, p) => sum + (p.comments?.length || 0), 0);
    const avgLikes = posts.length > 0 ? (totalLikes / posts.length).toFixed(1) : 0;
    const avgComments = posts.length > 0 ? (totalComments / posts.length).toFixed(1) : 0;

    return {
      totalPosts: posts.length,
      totalLikes,
      totalComments,
      totalOffers: 0,
      avgLikes,
      avgComments,
      pendingOffers: 0,
      acceptedOffers: 0,
    };
  };

  const formatPrice = (price) => {
    if (!price) return "Free";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  if (!isLoggedIn) {
    return (
      <div className="my-listings-page">
        <div className="empty-state">
          <h2>📊 My Listings</h2>
          <p>Please log in to view your listings</p>
        </div>
      </div>
    );
  }

  const totalAnalytics = getTotalAnalytics();

  return (
    <div className="my-listings-page">
      <div className="dashboard-header">
        <h1>📊 My Listings Dashboard</h1>
        <button
          className="btn-create-new"
          onClick={() => onNavigate("create-post")}
        >
          ➕ Create New Listing
        </button>
      </div>

      {/* Overview Stats */}
      <div className="overview-stats">
        <div className="stat-card primary">
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <span className="stat-value">{totalAnalytics.totalPosts}</span>
            <span className="stat-label">Total Listings</span>
          </div>
        </div>
        <div className="stat-card success">
          <div className="stat-icon">❤️</div>
          <div className="stat-content">
            <span className="stat-value">{totalAnalytics.totalLikes}</span>
            <span className="stat-label">Total Likes</span>
            <span className="stat-sub">Avg: {totalAnalytics.avgLikes}/listing</span>
          </div>
        </div>
        <div className="stat-card info">
          <div className="stat-icon">💬</div>
          <div className="stat-content">
            <span className="stat-value">{totalAnalytics.totalComments}</span>
            <span className="stat-label">Total Comments</span>
            <span className="stat-sub">Avg: {totalAnalytics.avgComments}/listing</span>
          </div>
        </div>
        {/* Offers widget removed */}
      </div>

      {/* Listings Table */}
      <div className="listings-section">
        <h2>My Listings</h2>
        {loading ? (
          <div className="loading">Loading listings...</div>
        ) : posts.length === 0 ? (
          <div className="empty-state">
            <p>No listings yet. Create your first listing!</p>
            <button
              className="btn-primary"
              onClick={() => onNavigate("create-post")}
            >
              Create Listing
            </button>
          </div>
        ) : (
          <div className="listings-grid">
            {posts.map((post) => {
              const analytics = getPostAnalytics(post);
              return (
                <div key={post._id} className="listing-card">
                  <div className="listing-image">
                    <img
                      src={post.images?.[0] || "/placeholder.png"}
                      alt={post.title}
                      onClick={() => onNavigate("post-details", { post })}
                    />
                    <div className="listing-status">
                      {post.boostedUntil &&
                      new Date(post.boostedUntil) > new Date() ? (
                        <span className="badge-boosted">🚀 Boosted</span>
                      ) : (
                        <span className="badge-active">✓ Active</span>
                      )}
                    </div>
                  </div>

                  <div className="listing-content">
                    <h3
                      className="listing-title"
                      onClick={() => onNavigate("post-details", { post })}
                    >
                      {post.title}
                    </h3>
                    <div className="listing-info">
                      <span className="listing-price">
                        {formatPrice(post.price)}
                      </span>
                      {post.category && (
                        <span className="listing-category">
                          {post.category}
                        </span>
                      )}
                    </div>

                    {/* Analytics */}
                    <div className="listing-analytics">
                      <div className="analytics-grid">
                        <div className="analytics-item">
                          <span className="analytics-icon">❤️</span>
                          <span className="analytics-value">
                            {analytics.likes}
                          </span>
                        </div>
                        <div className="analytics-item">
                          <span className="analytics-icon">💬</span>
                          <span className="analytics-value">
                            {analytics.comments}
                          </span>
                        </div>
                        {/* Offers metrics removed */}
                      </div>
                    </div>

                    <div className="listing-meta">
                      <span className="listing-date">
                        Posted {new Date(post.date).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="listing-actions">
                      <button
                        className="btn-edit"
                        onClick={() => handleEditPost(post)}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        className="btn-view"
                        onClick={() => onNavigate("post-details", { post })}
                      >
                        👁️ View
                      </button>
                      {/* Offers removed */}
                      <button
                        className="btn-delete"
                        onClick={() => handleDeletePost(post._id)}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="actions-grid">
          {/* Offers action removed (offers page deleted) */}
          <button
            className="action-card"
            onClick={() => onNavigate("messages")}
          >
            <span className="action-icon">💬</span>
            <span className="action-label">Messages</span>
          </button>
          <button
            className="action-card"
            onClick={() => onNavigate("profile")}
          >
            <span className="action-icon">👤</span>
            <span className="action-label">My Profile</span>
          </button>
          <button
            className="action-card"
            onClick={() => onNavigate("create-post")}
          >
            <span className="action-icon">➕</span>
            <span className="action-label">New Listing</span>
          </button>
        </div>
      </div>
    </div>
  );
}
