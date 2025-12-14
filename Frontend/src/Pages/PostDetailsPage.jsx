import React, { useState, useEffect } from "react";
import "../Style/PostDetailsPage.css";
import { useToast } from "../components/ToastContext";
import {
  toggleLikePost,
  addComment,
  deleteComment,
  addReply,
  deleteReply,
  getSellerProfile,
} from "../apis/Postsapi";
import { startConversation } from "../apis/Messagesapi";

export default function PostDetailsPage({
  postId,
  post: initialPost,
  onNavigate,
  user,
  isLoggedIn,
}) {
  const { showSuccess, showError } = useToast();
  const [post, setPost] = useState(initialPost);
  const [seller, setSeller] = useState(null);
  const [sellerStats, setSellerStats] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [comment, setComment] = useState("");
  const [replyText, setReplyText] = useState({});
  const [replyingTo, setReplyingTo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [autoPlayTimer, setAutoPlayTimer] = useState(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const CAROUSEL_INTERVAL = 10000; // 10 seconds

  const conditionLabels = {
    new: "Brand New",
    "like new": "Like New",
    good: "Good",
    fair: "Fair",
  };

  useEffect(() => {
    if (post?.sellerId) {
      fetchSellerProfile();
    }
  }, [post?.sellerId]);

  // Auto-cycle carousel effect
  useEffect(() => {
    if (!post?.images || post.images.length <= 1 || isHovering) {
      return;
    }

    // Clear existing timer
    if (autoPlayTimer) {
      clearInterval(autoPlayTimer);
    }

    // Set new timer for auto-cycling
    const timer = setInterval(() => {
      setCurrentImageIndex((prev) =>
        prev === post.images.length - 1 ? 0 : prev + 1
      );
    }, CAROUSEL_INTERVAL);

    setAutoPlayTimer(timer);

    return () => clearInterval(timer);
  }, [post?.images, isHovering, autoPlayTimer]);

  // Handle lightbox keyboard navigation
  useEffect(() => {
    if (!lightboxOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "ArrowLeft") {
        setLightboxIndex((prev) =>
          prev === 0 ? post.images.length - 1 : prev - 1
        );
      } else if (e.key === "ArrowRight") {
        setLightboxIndex((prev) =>
          prev === post.images.length - 1 ? 0 : prev + 1
        );
      } else if (e.key === "Escape") {
        setLightboxOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen, post?.images]);

  const fetchSellerProfile = async () => {
    try {
      const response = await getSellerProfile(
        post.sellerId._id || post.sellerId
      );
      setSellerStats(response?.stats);
      setSeller(response?.seller);
    } catch (error) {
      console.error("Failed to fetch seller profile:", error);
    }
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? post.images.length - 1 : prev - 1
    );
    // Reset timer
    if (autoPlayTimer) {
      clearInterval(autoPlayTimer);
      setAutoPlayTimer(null);
    }
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === post.images.length - 1 ? 0 : prev + 1
    );
    // Reset timer
    if (autoPlayTimer) {
      clearInterval(autoPlayTimer);
      setAutoPlayTimer(null);
    }
  };

  const handleLike = async () => {
    if (!isLoggedIn) {
      onNavigate("login");
      return;
    }

    // Validate user data - accept either user.id or user._id
    const userId = user?.id || user?._id;
    if (!user || !userId) {
      console.error("Invalid user data:", user);
      showError("User information is missing. Please log in again.");
      return;
    }

    try {
      setLoading(true);
      console.log("Toggling like with data:", {
        postId: post._id,
        userId: userId,
      });
      const response = await toggleLikePost({
        postId: post._id,
        userId: userId,
      });
      setPost(response.result);
      showSuccess(
        response.message === "Post liked"
          ? "Added to your likes!"
          : "Removed from your likes"
      );
    } catch (error) {
      console.error("Like error:", error);
      showError(error.message || "Failed to like post");
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();

    if (!isLoggedIn) {
      onNavigate("login");
      return;
    }

    if (!comment.trim()) {
      showError("Please write a comment");
      return;
    }

    // Validate user data - accept either user.id or user._id
    const userId = user?.id || user?._id;
    if (!user || !userId || !user.name) {
      console.error("Invalid user data:", user);
      showError("User information is missing. Please log in again.");
      return;
    }

    try {
      setCommentLoading(true);
      console.log("Adding comment with data:", {
        postId: post._id,
        userId: userId,
        userName: user.name,
        text: comment.trim(),
        userProfileImage: user.profileImage,
      });
      const response = await addComment({
        postId: post._id,
        userId: userId,
        userName: user.name,
        text: comment.trim(),
        userProfileImage: user.profileImage,
      });
      setPost(response.result);
      setComment("");
      showSuccess("Comment added!");
    } catch (error) {
      console.error("Comment error:", error);
      showError(error.message || "Failed to add comment");
    } finally {
      setCommentLoading(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!isLoggedIn) {
      return;
    }

    try {
      const response = await deleteComment(post._id, commentId);
      setPost(response.result);
      showSuccess("Comment deleted");
    } catch (error) {
      showError("Failed to delete comment");
    }
  };

  const handleAddReply = async (commentId) => {
    if (!isLoggedIn) {
      onNavigate("login");
      return;
    }

    const text = replyText[commentId]?.trim();
    if (!text) {
      showError("Please write a reply");
      return;
    }

    // Validate user data
    const userId = user?.id || user?._id;
    if (!user || !userId || !user.name) {
      showError("User information is missing. Please log in again.");
      return;
    }

    try {
      const response = await addReply({
        postId: post._id,
        commentId: commentId,
        userId: userId,
        userName: user.name,
        text: text,
        userProfileImage: user.profileImage,
      });
      setPost(response.result);
      setReplyText({ ...replyText, [commentId]: "" });
      setReplyingTo(null);
      showSuccess("Reply added!");
    } catch (error) {
      showError(error.message || "Failed to add reply");
    }
  };

  const handleDeleteReply = async (commentId, replyId) => {
    if (!isLoggedIn) {
      return;
    }

    try {
      const response = await deleteReply(post._id, commentId, replyId);
      setPost(response.result);
      showSuccess("Reply deleted");
    } catch (error) {
      showError("Failed to delete reply");
    }
  };

  const handleContactSeller = async () => {
    if (!isLoggedIn) {
      onNavigate("login");
      return;
    }

    if ((user?.id || user?._id) === post.sellerId._id || (user?.id || user?._id) === post.sellerId) {
      showError("You cannot message yourself");
      return;
    }

    try {
      const response = await startConversation(post.sellerId._id, post._id);
      showSuccess("Opening chat with seller...");
      onNavigate("messages");
    } catch (error) {
      showError(error.message || "Failed to start conversation");
    }
  };

  const isLiked = post.likes?.some((id) => id === (user?.id || user?._id));
  const isOwner =
    (user?.id || user?._id) === post.sellerId._id || (user?.id || user?._id) === post.sellerId;

  if (!post) {
    return (
      <div className="post-details-page">
        <div className="loading">Loading post...</div>
      </div>
    );
  }

  return (
    <div
      className="post-details-page"
      onClick={(e) => {
        if (e.target.classList.contains("lightbox-overlay")) {
          setLightboxOpen(false);
        }
      }}
    >
      {/* Lightbox Modal */}
      {lightboxOpen && post.images && post.images.length > 0 && (
        <div className="lightbox-overlay">
          <div className="lightbox-content">
            <button
              className="lightbox-close"
              onClick={() => setLightboxOpen(false)}
              title="Close (ESC)"
            >
              ✕
            </button>

            <div className="lightbox-image-container">
              <img
                src={post.images[lightboxIndex]}
                alt={post.title}
                className="lightbox-image"
              />
            </div>

            {post.images.length > 1 && (
              <>
                <button
                  className="lightbox-nav lightbox-prev"
                  onClick={() =>
                    setLightboxIndex((prev) =>
                      prev === 0 ? post.images.length - 1 : prev - 1
                    )
                  }
                  title="Previous (←)"
                >
                  ‹
                </button>
                <button
                  className="lightbox-nav lightbox-next"
                  onClick={() =>
                    setLightboxIndex((prev) =>
                      prev === post.images.length - 1 ? 0 : prev + 1
                    )
                  }
                  title="Next (→)"
                >
                  ›
                </button>
              </>
            )}

            <div className="lightbox-counter">
              {lightboxIndex + 1} / {post.images.length}
            </div>

            {post.images.length > 1 && (
              <div className="lightbox-thumbnails">
                {post.images.map((image, index) => (
                  <button
                    key={index}
                    className={`lightbox-thumbnail ${
                      index === lightboxIndex ? "active" : ""
                    }`}
                    onClick={() => setLightboxIndex(index)}
                  >
                    <img src={image} alt={`Lightbox ${index + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      <button
        className="back-button"
        onClick={() => onNavigate("home")}
        title="Go back"
      >
        ← Back
      </button>

      <div className="post-details-container">
        {/* Image Gallery */}
        <div className="image-section">
          <div className="image-gallery">
            <div
              className="main-image"
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
            >
              {post.images && post.images.length > 0 ? (
                <img
                  src={post.images[currentImageIndex]}
                  alt={post.title}
                  className="gallery-image"
                  onClick={() => {
                    setLightboxOpen(true);
                    setLightboxIndex(currentImageIndex);
                  }}
                  title="Click to enlarge"
                  style={{ cursor: "pointer" }}
                />
              ) : (
                <div className="no-image">📦</div>
              )}

              {post.images && post.images.length > 1 && (
                <>
                  <button
                    className="gallery-nav prev"
                    onClick={handlePrevImage}
                    title="Previous image"
                  >
                    ‹
                  </button>
                  <button
                    className="gallery-nav next"
                    onClick={handleNextImage}
                    title="Next image"
                  >
                    ›
                  </button>
                </>
              )}

              <div className="image-counter">
                {currentImageIndex + 1} / {post.images?.length || 0}
              </div>
            </div>

            {/* Thumbnails */}
            {post.images && post.images.length > 1 && (
              <div className="thumbnails">
                {post.images.map((image, index) => (
                  <button
                    key={index}
                    className={`thumbnail ${
                      index === currentImageIndex ? "active" : ""
                    }`}
                    onClick={() => setCurrentImageIndex(index)}
                  >
                    <img src={image} alt={`Thumbnail ${index + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Content Section */}
        <div className="content-section">
          {/* Title & Price */}
          <div className="header-info">
            <h1 className="post-title">{post.title}</h1>

            {post.price && (
              <div className="price-section">
                <span className="price">${post.price.toFixed(2)}</span>
                {post.condition && (
                  <span className="condition">
                    {conditionLabels[post.condition]}
                  </span>
                )}
              </div>
            )}

            {!post.price && post.condition && (
              <span className="condition free-badge">
                Free • {conditionLabels[post.condition]}
              </span>
            )}

            {!post.price && !post.condition && (
              <span className="condition free-badge">Free</span>
            )}

            <div className="meta-info">
              {post.category && (
                <span className="meta-item">
                  📁{" "}
                  {post.category.charAt(0).toUpperCase() +
                    post.category.slice(1)}
                </span>
              )}
              {post.location && (
                <span className="meta-item">📍 {post.location}</span>
              )}
              <span className="meta-item">
                📅{" "}
                {new Date(post.date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>

          {/* Seller Card */}
          <div className="seller-card">
            <div className="seller-info">
              <div className="seller-avatar">
                {post.sellerId?.profileImage ? (
                  <img
                    src={post.sellerId.profileImage}
                    alt={post.sellerId?.name || "Seller"}
                  />
                ) : (
                  <span className="avatar-placeholder">
                    {post.sellerId?.name?.charAt(0).toUpperCase() || "?"}
                  </span>
                )}
              </div>
              <div className="seller-details">
                <h3 className="seller-name">
                  {post.sellerId?.name || "Unknown Seller"}
                </h3>
                <div className="seller-stats">
                  {sellerStats ? (
                    <>
                      <span className="stat-item">
                        📦 {sellerStats.posts || 0} active listings
                      </span>
                      {sellerStats.avgLikes > 0 && (
                        <span className="stat-item">
                          ⭐ {((sellerStats.avgLikes / 20) * 5).toFixed(1)}/5
                          rating
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="stat-item">New seller</span>
                  )}
                </div>
                <p className="seller-contact">
                  {isOwner ? "✓ Your Listing" : "🟢 Usually responds fast"}
                </p>
                <p className="seller-info-text">
                  {post.sellerId?.verified ? "✓ Verified Seller" : "Member"} •
                  Active today
                </p>
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                className="btn-contact-seller"
                onClick={handleContactSeller}
                disabled={isOwner}
              >
                {isOwner ? "✓ Your Listing" : "💬 Message Seller"}
              </button>
            </div>
          </div>

          {/* Description */}
          {post.description && (
            <div className="description-section">
              <h3>About this item</h3>
              <p>{post.description}</p>
            </div>
          )}

          {/* Actions */}
          <div className="actions-section">
            <button
              className={`action-btn like-btn ${isLiked ? "liked" : ""}`}
              onClick={handleLike}
              disabled={loading}
            >
              <span className="like-icon">{isLiked ? "❤️" : "🤍"}</span>
              <span>{post.likes?.length || 0} Likes</span>
            </button>

            {isOwner && (
              <button
                className="action-btn edit-btn"
                onClick={() => onNavigate("create-post")}
              >
                ✏️ Edit Listing
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Comments Section */}
      <div className="comments-section">
        <h2>Comments ({post.comments?.length || 0})</h2>

        {/* Add Comment */}
        {isLoggedIn && !isOwner && (
          <form className="add-comment-form" onSubmit={handleAddComment}>
            <div className="comment-input-group">
              <input
                type="text"
                placeholder="Add a comment..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength="500"
                disabled={commentLoading}
              />
              <button
                type="submit"
                disabled={commentLoading || !comment.trim()}
                className="btn-submit-comment"
              >
                {commentLoading ? "..." : "Post"}
              </button>
            </div>
            <span className="char-count">{comment.length}/500</span>
          </form>
        )}

        {!isLoggedIn && (
          <div className="login-to-comment">
            <p>Sign in to leave a comment</p>
            <button
              className="btn-secondary"
              onClick={() => onNavigate("login")}
            >
              Sign In
            </button>
          </div>
        )}

        {/* Comments List */}
        <div className="comments-list">
          {post.comments && post.comments.length > 0 ? (
            post.comments.map((cmt) => (
              <div key={cmt._id} className="comment-thread">
                {/* Main Comment */}
                <div className="comment-item">
                  <div className="comment-avatar">
                    {cmt.userProfileImage ? (
                      <img
                        src={cmt.userProfileImage}
                        alt={cmt.userName}
                        className="comment-avatar-img"
                      />
                    ) : (
                      <div className="comment-avatar-placeholder">
                        {cmt.userName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="comment-content">
                    <div className="comment-header">
                      <span className="comment-author">{cmt.userName}</span>
                      <span className="comment-date">
                        {new Date(cmt.date).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <p className="comment-text">{cmt.text}</p>
                    <div className="comment-actions">
                      <button
                        className="btn-reply"
                        onClick={() =>
                          setReplyingTo(
                            replyingTo === cmt._id ? null : cmt._id
                          )
                        }
                      >
                        Reply
                      </button>
                      {isLoggedIn && (user?.id || user?._id) === cmt.userId && (
                        <button
                          className="btn-delete-comment"
                          onClick={() => handleDeleteComment(cmt._id)}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Replies */}
                {cmt.replies && cmt.replies.length > 0 && (
                  <div className="replies-list">
                    {cmt.replies.map((reply) => (
                      <div key={reply._id} className="reply-item">
                        <div className="reply-avatar">
                          {reply.userProfileImage ? (
                            <img
                              src={reply.userProfileImage}
                              alt={reply.userName}
                              className="reply-avatar-img"
                            />
                          ) : (
                            <div className="reply-avatar-placeholder">
                              {reply.userName.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="reply-content">
                          <div className="reply-header">
                            <span className="reply-author">{reply.userName}</span>
                            <span className="reply-date">
                              {new Date(reply.date).toLocaleDateString(
                                "en-US",
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                }
                              )}
                            </span>
                          </div>
                          <p className="reply-text">{reply.text}</p>
                          {isLoggedIn && (user?.id || user?._id) === reply.userId && (
                            <button
                              className="btn-delete-reply"
                              onClick={() =>
                                handleDeleteReply(cmt._id, reply._id)
                              }
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply Form */}
                {replyingTo === cmt._id && isLoggedIn && (
                  <form
                    className="reply-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleAddReply(cmt._id);
                    }}
                  >
                    <div className="reply-input-group">
                      <input
                        type="text"
                        placeholder={`Reply to ${cmt.userName}...`}
                        value={replyText[cmt._id] || ""}
                        onChange={(e) =>
                          setReplyText({
                            ...replyText,
                            [cmt._id]: e.target.value,
                          })
                        }
                        maxLength="500"
                      />
                      <button
                        type="submit"
                        disabled={!replyText[cmt._id]?.trim()}
                        className="btn-submit-reply"
                      >
                        Reply
                      </button>
                    </div>
                  </form>
                )}

                {replyingTo === cmt._id && !isLoggedIn && (
                  <div className="reply-login-prompt">
                    <p>Sign in to reply</p>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="no-comments">
              <p>No comments yet. Be the first to comment!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
