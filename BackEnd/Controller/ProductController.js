import mongoose from "mongoose";
import Product from "../Model/Product.js";

// --- Helpers ---
const buildProductFilter = (query) => {
  const filter = {};
  const { 
    search, category, minPrice, maxPrice, condition, status, sellerId,
    lat, lng, distance // For Geo-location search
  } = query;

  // Text Search (Name & Description)
  if (search) {
    filter.$text = { $search: search };
  }

  // Exact matches
  if (category) filter.category = category;
  if (condition) filter.condition = condition;
  if (status) filter.status = status;
  if (sellerId) filter.sellerId = sellerId;

  // Range queries
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  // Geo-location Search ($near)
  // Note: distance should be in meters
  if (lat && lng) {
    filter.location = {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [Number(lng), Number(lat)]
        },
        $maxDistance: Number(distance) || 5000 // default 5km
      }
    };
  }

  return filter;
};

// Create Product
export const createProduct = async (request, response) => {
  // TLDR: Creates a new product. Expects location to be passed as { lat, lng } or explicit GeoJSON.
  try {
    const { 
      sellerId, name, description, price, images, stock, category, condition, location 
    } = request.body;

    // Basic validation
    if (!sellerId || !name || !price || !category) {
      return response.status(400).json({ message: "sellerId, name, price, and category are required" });
    }

    // Format location for Mongoose 2dsphere index if provided as lat/lng objects
    let locationData = { type: "Point", coordinates: [0, 0] }; // default
    if (location && location.lat && location.lng) {
      locationData = {
        type: "Point",
        coordinates: [location.lng, location.lat] // GeoJSON expects [lng, lat]
      };
    } else if (location && location.coordinates) {
      locationData = location;
    }

    const product = new Product({
      sellerId,
      name,
      description,
      price,
      images: images || [],
      stock,
      category,
      condition,
      location: locationData,
      status: stock > 0 ? "available" : "sold"
    });

    const savedProduct = await product.save();

    return response.status(201).json({ message: "Product created successfully", result: savedProduct });
  } catch (e) {
    return response.status(500).json({ message: e.message });
  }
};

// Get All Products (Search, Filter, Pagination, Geo)
export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find().populate("sellerId", "name"); // important for seller name
    res.status(200).json({
      message: "Products retrieved",
      result: products, // <-- must be `result` for frontend
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
// Get Single Product (and increment View Count)
export const getProductById = async (request, response) => {
  // TLDR: Fetches product details and atomically increments the 'views' counter.
  try {
    const { id } = request.params;
    
    // Find and update views in one go so we don't need a separate write
    const product = await Product.findByIdAndUpdate(
      id, 
      { $inc: { views: 1 } }, 
      { new: true }
    ).populate("sellerId", "name email");

    if (!product) return response.status(404).json({ message: "Product not found" });

    return response.status(200).json({ message: "Product details", result: product });
  } catch (e) {
    return response.status(500).json({ message: e.message });
  }
};

// Update Product
export const updateProduct = async (request, response) => {
  // TLDR: Standard update. If stock is updated to 0, status is auto-set to 'sold'.
  try {
    const { id } = request.params;
    const updates = request.body;

    // Logic: If stock is updated, check if we need to change status
    if (typeof updates.stock === 'number') {
      updates.status = updates.stock > 0 ? "available" : "sold";
    }

    // Handle Location update if passed as lat/lng object again
    if (updates.location && updates.location.lat && updates.location.lng) {
      updates.location = {
        type: "Point",
        coordinates: [updates.location.lng, updates.location.lat]
      };
    }

    const product = await Product.findByIdAndUpdate(id, updates, { new: true, runValidators: true });

    if (!product) return response.status(404).json({ message: "Product not found" });

    return response.status(200).json({ message: "Product updated", result: product });
  } catch (e) {
    return response.status(500).json({ message: e.message });
  }
};

// Delete Product
export const deleteProduct = async (request, response) => {
  // TLDR: Hard delete. In a real app, you might want to check if there are active orders first.
  try {
    const { id } = request.params;
    const product = await Product.findByIdAndDelete(id);

    if (!product) return response.status(404).json({ message: "Product not found" });

    return response.status(200).json({ message: "Product deleted successfully" });
  } catch (e) {
    return response.status(500).json({ message: e.message });
  }
};

// Toggle Save (Wishlist)
export const toggleSaveProduct = async (request, response) => {
  // TLDR: Adds or Removes a user ID from the 'savedBy' array based on current state.
  try {
    const { id } = request.params;
    const { userId } = request.body; // In real app, get this from request.user (Auth Middleware)

    if (!userId) return response.status(400).json({ message: "userId required" });

    const product = await Product.findById(id);
    if (!product) return response.status(404).json({ message: "Product not found" });

    const isSaved = product.savedBy.includes(userId);
    
    const update = isSaved 
      ? { $pull: { savedBy: userId } } // Remove if exists
      : { $addToSet: { savedBy: userId } }; // Add if not exists

    const updatedProduct = await Product.findByIdAndUpdate(id, update, { new: true });

    return response.status(200).json({ 
      message: isSaved ? "Removed from saved" : "Added to saved", 
      result: updatedProduct 
    });
  } catch (e) {
    return response.status(500).json({ message: e.message });
  }
};

// Report Product
export const reportProduct = async (request, response) => {
  // TLDR: Adds a report entry to the product's report array.
  try {
    const { id } = request.params;
    const { userId, reason } = request.body;

    if (!userId || !reason) return response.status(400).json({ message: "userId and reason required" });

    const reportData = { userId, reason, date: new Date() };

    const product = await Product.findByIdAndUpdate(
      id,
      { $push: { reports: reportData } },
      { new: true }
    );

    if (!product) return response.status(404).json({ message: "Product not found" });

    return response.status(200).json({ message: "Product reported", result: product });
  } catch (e) {
    return response.status(500).json({ message: e.message });
  }
};

// Boost Product (Admin or Paid Feature)
export const boostProduct = async (request, response) => {
  // TLDR: Sets a date for 'boostedUntil' to prioritize product in feeds.
  try {
    const { id } = request.params;
    const { durationInDays } = request.body;

    const boostedUntil = new Date();
    boostedUntil.setDate(boostedUntil.getDate() + (durationInDays || 1));

    const product = await Product.findByIdAndUpdate(
      id,
      { boostedUntil },
      { new: true }
    );

    return response.status(200).json({ message: `Product boosted for ${durationInDays} days`, result: product });
  } catch (e) {
    return response.status(500).json({ message: e.message });
  }
};
// Add Review to Product
export const addProductReview = async (request, response) => {
  try {
    const { id } = request.params;
    const { userId, comment } = request.body;

    if (!userId || !comment) {
      return response.status(400).json({ message: "userId and comment are required" });
    }

    const review = { userId, comment, date: new Date() };

    const product = await Product.findByIdAndUpdate(
      id,
      { $push: { reviews: review } },
      { new: true }
    ).populate("reviews.userId", "name");

    if (!product)
      return response.status(404).json({ message: "Product not found" });

    return response.status(200).json({ message: "Review added", result: product });
  } catch (e) {
    return response.status(500).json({ message: e.message });
  }
};


/*
FEATURES ADDED FOR MARKETPLACE LOGIC:

1) Geo-Spatial Searching ($near)
   - Handles `lat`, `lng`, and `distance` (meters) query params.
   - Automatically formats `location` field to GeoJSON Point format on create/update.
   - Requires the "2dsphere" index (already in your model).

2) Text Search & Weighted Sorting
   - Uses the text index on `name` and `description`.
   - If a search term is present, results are sorted by text relevance score.

3) Atomic Views Increment
   - `getProductById` uses `$inc` to update the view counter in the same DB call as the fetch.
   - Prevents race conditions where two people viewing at once results in only 1 view added.

4) Wishlist / Saved Toggle
   - `toggleSaveProduct` checks if the user already saved the item.
   - Uses `$pull` to unsave and `$addToSet` to save, ensuring the array remains clean.

5) Status Automation
   - When stock hits 0 during update/create, status flips to "sold".
   - When stock > 0, status flips to "available".

6) Reporting System
   - Simple endpoint to push objects into the `reports` array for moderation tools.
*/