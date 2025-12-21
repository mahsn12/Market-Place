import { request, response } from "express";
import Post from "../Model/Post.js";
import User from "../Model/User.js";
import mongoose from "mongoose";

// Helpers
const normalizeCategoryValue = (c) => {
  if (c === null || c === undefined) return null;
  return c.toString().trim().toLowerCase() || null;
};

const escapeRegExp = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

// Helper: pagination defaults
const defaultPage = 1;
const defaultLimit = 10;

// Create Post (auth-based - uses req.user from middleware)
export const createPost = async (request, response) => {
  try {
    const {
      images,
      title,
      description,
      price,
      quantity,
      category,
      condition,
      location,
    } = request.body;

    if (
      !images ||
      !Array.isArray(images) ||
      images.length === 0 ||
      !title
    ) {
      return response
        .status(400)
        .json({ message: "title and images[] are required" });
    }

    const post = new Post({
      sellerId: request.user.id,
      images,
      title,
      description,
      price,
      quantity: quantity ?? 1,
      category: normalizeCategoryValue(category),
      condition,
      location,
    });
    await post.save();

    return response
      .status(201)
      .json({ message: "Post created successfully", result: post });
  } catch (e) {
    return response.status(500).json({ message: e.message });
  }
};

// Get distinct categories used in posts
export const getCategories = async (request, response) => {
  try {
    // only categories for posts that are available (quantity > 0)
    const categories = await Post.distinct("category", { quantity: { $gt: 0 }, category: { $ne: null, $ne: "" } });
    const cleaned = (categories || [])
      .filter((c) => c && typeof c === "string")
      .map((c) => c.toLowerCase())
      .filter((v, i, a) => a.indexOf(v) === i);

    return response.status(200).json({ message: "Categories retrieved", result: cleaned });
  } catch (e) {
    return response.status(500).json({ message: e.message });
  }
};

// Update Post (seller only)
export const updatePost = async (request, response) => {
  try {
    const { id } = request.params;
    const {
      images,
      title,
      description,
      price,
      quantity,
      category,
      condition,
      location,
    } = request.body;

    const post = await Post.findById(id);
    if (!post) {
      return response.status(404).json({ message: "Post not found" });
    }

    // Only seller can update their post
    if (post.sellerId.toString() !== request.user.id) {
      return response.status(403).json({ message: "Unauthorized" });
    }

    // Update fields
    if (title) post.title = title;
    if (description) post.description = description;
    if (price !== undefined) post.price = price;
    if (category !== undefined) post.category = normalizeCategoryValue(category);
    if (condition) post.condition = condition;
    if (images && Array.isArray(images)) post.images = images;
    if (location) post.location = location;
    
    if (quantity !== undefined) {
      if (quantity < 0) {
        return response
          .status(400)
          .json({ message: "Quantity cannot be negative" });
      }
      post.quantity = quantity;
    }

    await post.save();

    return response
      .status(200)
      .json({ message: "Post updated successfully", result: post });
  } catch (e) {
    return response.status(500).json({ message: e.message });
  }
};

// Get All Posts with pagination, sorting and basic filters (category, minPrice, maxPrice, sellerId)
export const getAllPosts = async (request, response) => {
  try {
    const page = parseInt(request.query.page) || defaultPage;
    const limit = parseInt(request.query.limit) || defaultLimit;
    const skip = (page - 1) * limit;

    const { category, minPrice, maxPrice, sellerId, sort } = request.query;
    const filter = { quantity: { $gt: 0 } };
    if (category) {
      // make category filter case-insensitive and normalized
      const c = normalizeCategoryValue(category);
      if (c) filter.category = { $regex: new RegExp(`^${escapeRegExp(c)}$`, "i") };
    }
    if (sellerId) filter.sellerId = sellerId;
    if (minPrice)
      filter.price = { ...(filter.price || {}), $gte: Number(minPrice) };
    if (maxPrice)
      filter.price = { ...(filter.price || {}), $lte: Number(maxPrice) };

    // sorting: latest (date), mostLiked, priceAsc, priceDesc, boosted first
    let sortObj = { date: -1 };
    if (sort === "mostLiked") sortObj = { likesCount: -1, date: -1 };
    else if (sort === "priceAsc") sortObj = { price: 1 };
    else if (sort === "priceDesc") sortObj = { price: -1 };

    // If `boostedUntil` exists and is in the future, prefer boosted posts by sorting them first
    const posts = await Post.aggregate([
      { $match: filter },
      {
        $lookup: {
          from: "users",
          localField: "sellerId",
          foreignField: "_id",
          as: "sellerData",
        },
      },
      {
        $unwind: {
          path: "$sellerData",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          sellerId: {
            _id: "$sellerId",
            name: "$sellerData.name",
            profileImage: "$sellerData.profileImage",
            verified: "$sellerData.verified",
          },
          boostedScore: {
            $cond: [{ $gt: ["$boostedUntil", new Date()] }, 1, 0],
          },
          likesCount: { $size: { $ifNull: ["$likes", []] } },
          commentsCount: { $size: { $ifNull: ["$comments", []] } },
        },
      },
      { $sort: Object.assign({ boostedScore: -1 }, sortObj) },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          sellerData: 0,
        },
      },
    ]);

    return response
      .status(200)
      .json({ message: "Posts retrieved", page, limit, result: posts });
  } catch (e) {
    return response.status(500).json({ message: e.message });
  }
};

// Search posts (text search)
export const searchPosts = async (request, response) => {
  try {
    const q = request.query.q || "";
    const page = parseInt(request.query.page) || defaultPage;
    const limit = parseInt(request.query.limit) || defaultLimit;
    const skip = (page - 1) * limit;

    // Build search pipeline - first lookup seller, then match
    const pipeline = [
      {
        $match: { quantity: { $gt: 0 } }
      },
      {
        $lookup: {
          from: "users",
          localField: "sellerId",
          foreignField: "_id",
          as: "sellerData",
        },
      },
      {
        $unwind: {
          path: "$sellerData",
          preserveNullAndEmptyArrays: true,
        },
      },
    ];

    // Add search criteria: title (primary), description (secondary), seller name (tertiary)
    if (q.trim()) {
      const searchRegex = new RegExp(q.trim(), "i");
      pipeline.push({
        $match: {
          $or: [
            { title: searchRegex },
            { description: searchRegex },
            { "sellerData.name": searchRegex },
          ],
        },
      });
    }

    // Format seller data and pagination
    pipeline.push(
      {
        $addFields: {
          sellerId: {
            _id: "$sellerId",
            name: "$sellerData.name",
            profileImage: "$sellerData.profileImage",
            verified: "$sellerData.verified",
          },
        },
      },
      { $sort: { date: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          sellerData: 0,
        },
      }
    );

    const posts = await Post.aggregate(pipeline);

    return response
      .status(200)
      .json({ message: "Search results", page, limit, result: posts });
  } catch (e) {
    return response.status(500).json({ message: e.message });
  }
};

// Get Trending Posts (combines recency + interactions)
export const getTrendingPosts = async (request, response) => {
  try {
    // simple score = likesCount * 2 + commentsCount * 1 - ageInHours/24
    const posts = await Post.aggregate([
      {
        $match: { quantity: { $gt: 0 } }
      },
      {
        $lookup: {
          from: "users",
          localField: "sellerId",
          foreignField: "_id",
          as: "sellerData",
        },
      },
      {
        $unwind: {
          path: "$sellerData",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          likesCount: { $size: { $ifNull: ["$likes", []] } },
          commentsCount: { $size: { $ifNull: ["$comments", []] } },
          ageHours: {
            $divide: [{ $subtract: [new Date(), "$date"] }, 1000 * 60 * 60],
          },
        },
      },
      {
        $addFields: {
          trendingScore: {
            $subtract: [
              { $add: [{ $multiply: ["$likesCount", 2] }, "$commentsCount"] },
              { $divide: ["$ageHours", 24] },
            ],
          },
          sellerId: {
            _id: "$sellerId",
            name: "$sellerData.name",
            profileImage: "$sellerData.profileImage",
            verified: "$sellerData.verified",
          },
        },
      },
      { $sort: { trendingScore: -1 } },
      { $limit: 20 },
      {
        $project: {
          sellerData: 0,
        },
      },
    ]);

    return response
      .status(200)
      .json({ message: "Trending posts", result: posts });
  } catch (e) {
    return response.status(500).json({ message: e.message });
  }
};

// `toggleSavePost` removed: save/bookmark feature deprecated

// Report Post (adds report to post.reports array)
export const reportPost = async (request, response) => {
  try {
    const { postId, reason } = request.body;
    const userId = request.user.id;
    
    if (!postId || !reason) {
      return response
        .status(400)
        .json({ message: "postId and reason are required" });
    }

    const post = await Post.findById(postId);
    if (!post) return response.status(404).json({ message: "Post not found" });

    post.reports = post.reports || [];
    post.reports.push({ userId, reason, date: new Date() });
    await post.save();

    // In production: create a moderation job/notification here
    return response
      .status(200)
      .json({ message: "Report submitted", result: post });
  } catch (e) {
    return response.status(500).json({ message: e.message });
  }
};

// Boost Post (seller pays to boost; here we just set boostedUntil date)
export const boostPost = async (request, response) => {
  try {
    const { postId, days } = request.body;
    const sellerId = request.user.id;
    
    if (!postId || !days) {
      return response
        .status(400)
        .json({ message: "postId and days required" });
    }

    const post = await Post.findById(postId);
    if (!post) return response.status(404).json({ message: "Post not found" });
    
    if (post.sellerId.toString() !== sellerId.toString()) {
      return response
        .status(403)
        .json({ message: "Only seller can boost their post" });
    }

    const now = new Date();
    const currentBoost =
      post.boostedUntil && post.boostedUntil > now ? post.boostedUntil : now;
    const newBoostUntil = new Date(
      currentBoost.getTime() + Number(days) * 24 * 60 * 60 * 1000
    );

    post.boostedUntil = newBoostUntil;
    await post.save();

    return response
      .status(200)
      .json({
        message: "Post boosted",
        boostedUntil: post.boostedUntil,
        result: post,
      });
  } catch (e) {
    return response.status(500).json({ message: e.message });
  }
};

// Follow a seller (simple endpoint - this requires a `following` array on User model or a separate Follows collection)
export const followSeller = async (request, response) => {
  try {
    const { sellerId } = request.body;
    const userId = request.user.id;
    
    if (!sellerId) {
      return response
        .status(400)
        .json({ message: "sellerId required" });
    }

    const user = await User.findById(userId);
    const seller = await User.findById(sellerId);
    if (!user || !seller) {
      return response.status(404).json({ message: "User or seller not found" });
    }

    // For simplicity, we store following in `user.following` — make sure User model has it.
    user.following = user.following || [];
    const already = user.following.some(
      (id) => id.toString() === sellerId.toString()
    );
    if (already) {
      user.following = user.following.filter(
        (id) => id.toString() !== sellerId.toString()
      );
    } else {
      user.following.push(sellerId);
    }

    await user.save();

    return response
      .status(200)
      .json({ message: already ? "Unfollowed" : "Followed", result: user });
  } catch (e) {
    return response.status(500).json({ message: e.message });
  }
};

// Get Seller Profile with basic stats (posts count, avg likes per post) — useful for trust signals
export const getSellerProfile = async (request, response) => {
  try {
    const { sellerId } = request.params;
    const seller = await User.findById(sellerId).select("name profileImage");
    if (!seller)
      return response.status(404).json({ message: "Seller not found" });

    const stats = await Post.aggregate([
      { $match: { sellerId: seller._id } },
      { $project: { likesCount: { $size: { $ifNull: ["$likes", []] } } } },
      {
        $group: {
          _id: null,
          posts: { $sum: 1 },
          avgLikes: { $avg: "$likesCount" },
        },
      },
    ]);

    const result = stats[0] || { posts: 0, avgLikes: 0 };

    return response
      .status(200)
      .json({ message: "Seller profile", seller, stats: result });
  } catch (e) {
    return response.status(500).json({ message: e.message });
  }
};

// Get Posts by Seller
export const getPostsBySeller = async (request, response) => {
  try {
    const { sellerId } = request.params;
    const page = parseInt(request.query.page) || defaultPage;
    const limit = parseInt(request.query.limit) || defaultLimit;
    const skip = (page - 1) * limit;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(sellerId)) {
      return response.status(400).json({ message: "Invalid seller ID format" });
    }

    const sellerObjectId = new mongoose.Types.ObjectId(sellerId);

    const posts = await Post.aggregate([
      { 
        $match: { 
          sellerId: sellerObjectId,
          quantity: { $gt: 0 }  // Added: hide sold-out posts
        } 
      },
      {
        $lookup: {
          from: "users",
          localField: "sellerId",
          foreignField: "_id",
          as: "sellerData",
        },
      },
      {
        $unwind: {
          path: "$sellerData",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          sellerId: {
            _id: "$sellerId",
            name: "$sellerData.name",
            profileImage: "$sellerData.profileImage",
            verified: "$sellerData.verified",
          },
        },
      },
      { $sort: { date: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          sellerData: 0,
        },
      },
    ]);

    const total = await Post.countDocuments({ 
      sellerId: sellerObjectId,
      quantity: { $gt: 0 }  // Updated: count only available posts
    });

    return response.status(200).json({
      message: "Seller posts",
      page,
      limit,
      total,
      result: posts,
    });
  } catch (e) {
    return response.status(500).json({ message: e.message });
  }
};

// Existing helpers: Like/Unlike and Comments remain useful — keep previous implementations
export const toggleLikePost = async (request, response) => {
  try {
    const { postId } = request.body;
    const userId = request.user.id;

    if (!postId) {
      return response
        .status(400)
        .json({ message: "postId is required" });
    }

    const post = await Post.findById(postId);
    if (!post) return response.status(404).json({ message: "Post not found" });

    const alreadyLiked = post.likes.some(
      (id) => id.toString() === userId.toString()
    );

    if (alreadyLiked) {
      post.likes.pull(userId);
    } else {
      post.likes.push(userId);
    }

    await post.save();

    return response
      .status(200)
      .json({
        message: alreadyLiked ? "Post unliked" : "Post liked",
        result: post,
      });
  } catch (e) {
    return response.status(500).json({ message: e.message });
  }
};

export const addComment = async (request, response) => {
  try {
    const { postId, userName, text, userProfileImage } = request.body;
    const userId = request.user.id;

    if (!postId || !userName || !text) {
      return response
        .status(400)
        .json({ message: "postId, userName, and text are required" });
    }

    const post = await Post.findById(postId);
    if (!post) return response.status(404).json({ message: "Post not found" });

    post.comments.push({ userId, userName, text, userProfileImage });
    await post.save();

    return response
      .status(201)
      .json({ message: "Comment added", result: post });
  } catch (e) {
    return response.status(500).json({ message: e.message });
  }
};

export const deleteComment = async (request, response) => {
  try {
    const { postId, commentId } = request.params;

    const post = await Post.findById(postId);
    if (!post) return response.status(404).json({ message: "Post not found" });

    const comment = post.comments.id(commentId);
    if (!comment)
      return response.status(404).json({ message: "Comment not found" });

    comment.remove();
    await post.save();

    return response
      .status(200)
      .json({ message: "Comment deleted", result: post });
  } catch (e) {
    return response.status(500).json({ message: e.message });
  }
};

export const addReply = async (request, response) => {
  try {
    const { postId, commentId, userName, text, userProfileImage } = request.body;
    const userId = request.user.id;

    if (!postId || !commentId || !userName || !text) {
      return response
        .status(400)
        .json({ message: "postId, commentId, userName, and text are required" });
    }

    const post = await Post.findById(postId);
    if (!post) return response.status(404).json({ message: "Post not found" });

    const comment = post.comments.id(commentId);
    if (!comment) return response.status(404).json({ message: "Comment not found" });

    comment.replies.push({ userId, userName, text, userProfileImage });
    await post.save();

    return response
      .status(201)
      .json({ message: "Reply added", result: post });
  } catch (e) {
    return response.status(500).json({ message: e.message });
  }
};

export const deleteReply = async (request, response) => {
  try {
    const { postId, commentId, replyId } = request.params;

    const post = await Post.findById(postId);
    if (!post) return response.status(404).json({ message: "Post not found" });

    const comment = post.comments.id(commentId);
    if (!comment) return response.status(404).json({ message: "Comment not found" });

    const reply = comment.replies.id(replyId);
    if (!reply) return response.status(404).json({ message: "Reply not found" });

    reply.remove();
    await post.save();

    return response
      .status(200)
      .json({ message: "Reply deleted", result: post });
  } catch (e) {
    return response.status(500).json({ message: e.message });
  }
};

export const deletePost = async (request, response) => {
  try {
    const { id } = request.params;
    
    const post = await Post.findById(id);
    if (!post) {
      return response.status(404).json({ message: "Post not found" });
    }

    // Only seller can delete their post
    if (post.sellerId.toString() !== request.user.id) {
      return response.status(403).json({ message: "Unauthorized" });
    }

    // Clean up carts before deleting post
    await User.updateMany(
      { "cart.postId": id },
      { $pull: { cart: { postId: id } } }
    );

    await Post.findByIdAndDelete(id);

    return response.status(200).json({ message: "Post deleted successfully" });
  } catch (e) {
    return response.status(500).json({ message: e.message });
  }
};

// Search posts by title prefix (first letter or more), sorted by time
export const searchPostsByTitlePrefixController  = async (request, response) => {
  try {
    const q = (request.query.q || "").trim();
    const page = parseInt(request.query.page) || defaultPage;
    const limit = parseInt(request.query.limit) || defaultLimit;
    const skip = (page - 1) * limit;

    if (!q) {
      return response.status(400).json({ message: "Search query is required" });
    }

    // ^q  → starts with
    const titleRegex = new RegExp(`^${q}`, "i");

    const posts = await Post.aggregate([
      {
        $match: {
          title: titleRegex,
          quantity: { $gt: 0 },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "sellerId",
          foreignField: "_id",
          as: "sellerData",
        },
      },
      {
        $unwind: {
          path: "$sellerData",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          sellerId: {
            _id: "$sellerId",
            name: "$sellerData.name",
            profileImage: "$sellerData.profileImage",
            verified: "$sellerData.verified",
          },
          likesCount: { $size: { $ifNull: ["$likes", []] } },
          commentsCount: { $size: { $ifNull: ["$comments", []] } },
        },
      },
      { $sort: { date: -1 } }, // newest first
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          sellerData: 0,
        },
      },
    ]);

    return response.status(200).json({
      message: "Posts found",
      page,
      limit,
      result: posts,
    });
  } catch (e) {
    return response.status(500).json({ message: e.message });
  }
};
