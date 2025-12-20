import React, { useState } from "react";
import "../Style/CreatePostPage.css";
import { createPost, updatePost } from "../apis/Postsapi";
import { useToast } from "../components/ToastContext";
import { detectCategoryFromImages } from "../apis/Postsapi";


export default function CreatePostPage({
  onNavigate,
  user,
  isLoggedIn,
  existingPost = null,
}) {
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [detectingCategory, setDetectingCategory] = useState(false);
  const [formData, setFormData] = useState({
    title: existingPost?.title || "",
    description: existingPost?.description || "",
    price: existingPost?.price || "",
    quantity: existingPost?.quantity ?? 1,
    category: existingPost?.category || "",
    condition: existingPost?.condition || "good",
    images: existingPost?.images || [],
    location: existingPost?.location || "",
  });


  const [imagePreviews, setImagePreviews] = useState(existingPost?.images || []);
  const [activeTab, setActiveTab] = useState("details");

  const categories = [
    { value: "electronics", label: "Electronics", emoji: "📱" },
    { value: "furniture", label: "Furniture", emoji: "🪑" },
    { value: "fashion", label: "Fashion", emoji: "👔" },
    { value: "books", label: "Books", emoji: "📚" },
    { value: "home", label: "Home & Garden", emoji: "🏠" },
    { value: "sports", label: "Sports", emoji: "⚽" },
    { value: "toys", label: "Toys & Games", emoji: "🎮" },
    { value: "vehicles", label: "Vehicles", emoji: "🚗" },
    { value: "other", label: "Other", emoji: "📦" },
  ];

  const conditions = [
    { value: "new", label: "New", desc: "Brand new, never used" },
    { value: "like new", label: "Like New", desc: "Barely used, excellent" },
    { value: "good", label: "Good", desc: "Some signs of use" },
    { value: "fair", label: "Fair", desc: "Visible wear & tear" },
  ];

 const detectCategory = async (images) => {
  try {
    setDetectingCategory(true);

    const response = await detectCategoryFromImages(images);

    const detected = response?.category?.toLowerCase();

    const allowedCategories = categories.map(c => c.value);

    if (!allowedCategories.includes(detected)) {
      throw new Error("Invalid category from AI");
    }

    setFormData((prev) => ({
      ...prev,
      category: detected,
    }));

    showSuccess(`Category detected: ${detected}`);
  } catch (err) {
    console.error("Category detection failed:", err);
    showError("Could not detect category. Please select manually.");
  } finally {
    setDetectingCategory(false);
  }
};


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const remainingSlots = 15 - imagePreviews.length;

    if (files.length > remainingSlots) {
      showError(
        `You can only upload ${remainingSlots} more image(s). Maximum is 15.`
      );
      return;
    }

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result]);

        setFormData((prev) => {
          const updatedImages = [...prev.images, reader.result];

          // 🔥 Detect category ONLY on first image
          if (prev.images.length === 0) {
            detectCategory(updatedImages);
          }

          return {
            ...prev,
            images: updatedImages,
          };
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      showError("Title is required");
      return false;
    }
    if (formData.title.length < 5) {
      showError("Title must be at least 5 characters");
      return false;
    }
    if (imagePreviews.length === 0) {
      showError("At least one image is required");
      return false;
    }
    if (!formData.category) {
      showError("Category is being detected from images");
      return false;
    }
    if (formData.price && formData.price < 0) {
      showError("Price cannot be negative");
      return false;
    }

    if (formData.quantity < 1) {
      showError("Quantity must be at least 1");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setLoading(true);

    const postData = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      price: formData.price ? parseFloat(formData.price) : null,
      quantity: parseInt(formData.quantity, 10),
      category: formData.category,
      condition: formData.condition,
      images: formData.images,
      location: formData.location || null,
    };


      let response;
      if (existingPost) {
        response = await updatePost(existingPost._id, postData);
        showSuccess("Post updated successfully!");
      } else {
        response = await createPost(postData);
        showSuccess("Post created successfully!");
      }

      onNavigate("home");
    } catch (error) {
      console.error("Error submitting post:", error);
      showError(error.message || "Failed to create post");
    } finally {
      setLoading(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="create-post-page">
        <div className="login-prompt">
          <div className="login-prompt-icon">🔐</div>
          <h2>You must be logged in to create a listing</h2>
          <p>Sign in to start selling or sharing items</p>
          <button
            className="btn-primary btn-lg"
            onClick={() => onNavigate("login")}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="create-post-page">
      <div className="create-post-wrapper">
        {/* Header */}
        <div className="form-header">
          <button
            className="back-btn"
            onClick={() => onNavigate("home")}
            title="Go back"
          >
            ← Back
          </button>
          <div className="header-content">
            <h1>{existingPost ? "Edit Your Listing" : "Create a New Listing"}</h1>
            <p>
              {existingPost
                ? "Update your item details"
                : "List something you want to sell"}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="form-tabs">
          <button
            className={`tab ${activeTab === "details" ? "active" : ""}`}
            onClick={() => setActiveTab("details")}
          >
            📝 Details
          </button>
          <button
            className={`tab ${activeTab === "images" ? "active" : ""}`}
            onClick={() => setActiveTab("images")}
          >
            📸 Photos ({imagePreviews.length}/15)
          </button>
        </div>

        <form onSubmit={handleSubmit} className="create-post-form">
          {/* Details Tab */}
          {activeTab === "details" && (
            <div className="tab-content">
              {/* Title */}
              <div className="form-group">
                <label htmlFor="title">
                  Title <span className="required">*</span>
                </label>
                <input
                  id="title"
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., iPhone 13 Pro 256GB Silver"
                  maxLength="100"
                  required
                  className="input-lg"
                />
                <div className="char-count">
                  {formData.title.length}/100 characters
                </div>
              </div>

              {/* Category */}
              <div className="form-group">
                <label htmlFor="category">
                  Category <span className="required">*</span>
                </label>
                {detectingCategory && (
                  <p style={{ color: "#999", marginTop: "4px" }}>
                    Detecting category from image...
                  </p>
                )}
                {formData.category && !detectingCategory && (
                  <p style={{ color: "#4caf50", marginTop: "4px" }}>
                    Detected: {formData.category}
                  </p>
                )}
                <div className="category-grid">
                  {categories.map((cat) => (
                    <label
                      key={cat.value}
                      className={`category-option ${
                        formData.category === cat.value ? "selected" : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="category"
                        value={cat.value}
                        checked={formData.category === cat.value}
                        onChange={handleInputChange}  // Re-enable this
                        hidden
                      />

                      <span className="category-emoji">{cat.emoji}</span>
                      <span className="category-name">{cat.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Condition */}
              <div className="form-group">
                <label>Item Condition</label>
                <div className="condition-grid">
                  {conditions.map((cond) => (
                    <label
                      key={cond.value}
                      className={`condition-option ${
                        formData.condition === cond.value ? "selected" : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="condition"
                        value={cond.value}
                        checked={formData.condition === cond.value}
                        onChange={handleInputChange}
                        hidden
                      />
                      <div className="condition-card">
                        <div className="condition-label">{cond.label}</div>
                        <div className="condition-desc">{cond.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="form-group">
                <label htmlFor="description">
                  Description
                  <span className="optional"> (optional)</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe your item: condition, features, defects, etc."
                  maxLength="2000"
                  rows="6"
                  className="textarea-lg"
                />
                <div className="char-count">
                  {formData.description.length}/2000 characters
                </div>
              </div>

              {/* Price */}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="price">
                    Price <span className="optional"> (optional)</span>
                  </label>
                  <div className="input-group">
                    <span className="currency">$</span>
                    <input
                      id="price"
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className="input-with-prefix"
                    />
                  </div>
                  <p className="form-hint">
                    Leave blank for free items or to accept offers
                  </p>
                </div>
                <div className="form-group">
                  <label htmlFor="quantity">
                    Quantity <span className="required">*</span>
                  </label>
                  <input
                    id="quantity"
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    min="1"
                    step="1"
                    placeholder="1"
                  />
                  <p className="form-hint">
                    Number of items available
                  </p>
                </div>

                {/* Location */}
                <div className="form-group">
                  <label htmlFor="location">
                    Location <span className="optional"> (optional)</span>
                  </label>
                  <input
                    id="location"
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="e.g., New York, NY"
                    maxLength="100"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Images Tab */}
          {activeTab === "images" && (
            <div className="tab-content">
              <div className="images-section">
                <h3>Add Photos</h3>
                <p className="section-hint">
                  Add at least 1 photo. Up to 15 photos allowed.
                  <br />
                  Clear photos help sell faster!
                </p>

                {imagePreviews.length < 15 && (
                  <label htmlFor="images" className="upload-area">
                    <div className="upload-content">
                      <div className="upload-icon">📸</div>
                      <div className="upload-text">
                        <strong>Click to upload</strong> or drag and drop
                      </div>
                      <div className="upload-subtext">
                        PNG, JPG, GIF up to 10MB each
                      </div>
                    </div>
                    <input
                      id="images"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      hidden
                    />
                  </label>
                )}

                {/* Image Previews */}
                {imagePreviews.length > 0 && (
                  <div className="images-preview-section">
                    <div className="preview-header">
                      <h4>{imagePreviews.length} Photo(s) Added</h4>
                    </div>
                    <div className="image-previews-grid">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="image-preview-item">
                          {index === 0 && <div className="badge-primary">Main</div>}
                          <img src={preview} alt={`Preview ${index + 1}`} />
                          <button
                            type="button"
                            className="btn-remove-image"
                            onClick={() => removeImage(index)}
                            title="Remove photo"
                          >
                            ✕
                          </button>
                        </div>
                      ))}

                      {imagePreviews.length < 15 && (
                        <label htmlFor="images-more" className="add-more-photos">
                          <div className="add-more-content">
                            <span className="plus-icon">+</span>
                            <span>Add Photos</span>
                          </div>
                          <input
                            id="images-more"
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleImageUpload}
                            hidden
                          />
                        </label>
                      )}
                    </div>
                  </div>
                )}

                {imagePreviews.length === 0 && (
                  <div className="empty-images">
                    <div className="empty-icon">📸</div>
                    <p>No photos yet. Add your first photo to get started!</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary btn-lg"
              onClick={() => onNavigate("home")}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary btn-lg btn-success"
              disabled={loading || imagePreviews.length === 0}
            >
              {loading
                ? existingPost
                  ? "Updating..."
                  : "Publishing..."
                : existingPost
                ? "Update Listing"
                : "Publish Listing"}
            </button>
          </div>
        </form>

        {/* Info Box */}
        <div className="info-box">
          <h4>💡 Tips for a Great Listing</h4>
          <ul>
            <li>Use a clear, specific title with key details (brand, model, size)</li>
            <li>Add 3-5 high-quality photos from different angles</li>
            <li>Be honest about the item's condition and any defects</li>
            <li>Include relevant details (dimensions, materials, features)</li>
            <li>Set a realistic price compared to similar items</li>
            <li>Respond quickly to buyer questions</li>
          </ul>
        </div>
      </div>
    </div>
  );
}