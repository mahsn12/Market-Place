import { request, response } from "express";
import Post from "../Model/Post.js";
import User from "../Model/User.js";

// Helper: pagination defaults
const defaultPage = 1;
const defaultLimit = 10;

// Create Post (seller should provide title, description, price, category, images, location optional)
export const createPost = async (request, response) => {
  try {
    const { sellerId, images, title, description, price, category, location } = request.body;

    if (!sellerId || !images || !Array.isArray(images) || images.length === 0 || !title) {
      return response.status(400).json({ message: "sellerId, title and images[] are required" });
    }

    const seller = await User.findById(sellerId);
    if (!seller) return response.status(404).json({ message: "Seller not found" });

    const post = new Post({ sellerId, images, title, description, price, category, location });
    await post.save();

    return response.status(201).json({ message: "Post created successfully", result: post });
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
    const filter = {};
    if (category) filter.category = category;
    if (sellerId) filter.sellerId = sellerId;
    if (minPrice) filter.price = { ...(filter.price || {}), $gte: Number(minPrice) };
    if (maxPrice) filter.price = { ...(filter.price || {}), $lte: Number(maxPrice) };

    // sorting: latest (date), mostLiked, priceAsc, priceDesc, boosted first
    let sortObj = { date: -1 };
    if (sort === "mostLiked") sortObj = { "likesCount": -1, date: -1 };
    else if (sort === "priceAsc") sortObj = { price: 1 };
    else if (sort === "priceDesc") sortObj = { price: -1 };

    // If `boostedUntil` exists and is in the future, prefer boosted posts by sorting them first
    const posts = await Post.aggregate([
      { $match: filter },
      {
        $addFields: {
          boostedScore: {
            $cond: [{ $gt: ["$boostedUntil", new Date()] }, 1, 0]
          },
          likesCount: { $size: { $ifNull: ["$likes", []] } },
          commentsCount: { $size: { $ifNull: ["$comments", []] } }
        }
      },
      { $sort: Object.assign({ boostedScore: -1 }, sortObj) },
      { $skip: skip },
      { $limit: limit }
    ]);

    return response.status(200).json({ message: "Posts retrieved", page, limit, result: posts });
  } catch (e) {
    return response.status(500).json({ message: e.message });
  }
};

// Search posts (text) + optional geo radius search (requires Post.location as GeoJSON Point coords: [lng,lat])
export const searchPosts = async (request, response) => {
  try {
    const q = request.query.q || "";
    const page = parseInt(request.query.page) || defaultPage;
    const limit = parseInt(request.query.limit) || defaultLimit;
    const skip = (page - 1) * limit;

    const { lat, lng, radius } = request.query; // radius in kilometers

    const textSearch = q.trim() ? { $text: { $search: q } } : {};

    const pipeline = [{ $match: textSearch }];

    if (lat && lng && radius) {
      const meters = Number(radius) * 1000;
      pipeline.push({
        $geoNear: {
          near: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
          distanceField: "distance",
          maxDistance: meters,
          spherical: true
        }
      });
    }

    pipeline.push(
      { $skip: skip },
      { $limit: limit }
    );

    const posts = await Post.aggregate(pipeline);

    return response.status(200).json({ message: "Search results", page, limit, result: posts });
  } catch (e) {
    // If user uses $geoNear but Post doesn't have proper indexes, Mongo will throw — tell the developer
    return response.status(500).json({ message: e.message });
  }
};

// Get Trending Posts (combines recency + interactions)
export const getTrendingPosts = async (request, response) => {
  try {
    // simple score = likesCount * 2 + commentsCount * 1 - ageInHours/24
    const posts = await Post.aggregate([
      {
        $addFields: {
          likesCount: { $size: { $ifNull: ["$likes", []] } },
          commentsCount: { $size: { $ifNull: ["$comments", []] } },
          ageHours: { $divide: [{ $subtract: [new Date(), "$date"] }, 1000 * 60 * 60] }
        }
      },
      {
        $addFields: {
          trendingScore: { $subtract: [{ $add: [{ $multiply: ["$likesCount", 2] }, "$commentsCount"] }, { $divide: ["$ageHours", 24] }] }
        }
      },
      { $sort: { trendingScore: -1 } },
      { $limit: 20 }
    ]);

    return response.status(200).json({ message: "Trending posts", result: posts });
  } catch (e) {
    return response.status(500).json({ message: e.message });
  }
};

// Save / Bookmark a post (adds userId to post.savedBy array — Post model must have savedBy: [ObjectId])
export const toggleSavePost = async (request, response) => {
  try {
    const { postId, userId } = request.body;
    if (!postId || !userId) return response.status(400).json({ message: "postId and userId required" });

    const post = await Post.findById(postId);
    if (!post) return response.status(404).json({ message: "Post not found" });

    const alreadySaved = (post.savedBy || []).some(id => id.toString() === userId.toString());

    if (alreadySaved) post.savedBy.pull(userId);
    else post.savedBy.push(userId);

    await post.save();

    return response.status(200).json({ message: alreadySaved ? "Unsaved" : "Saved", result: post });
  } catch (e) {
    return response.status(500).json({ message: e.message });
  }
};

// Report Post (adds report to post.reports array)
export const reportPost = async (request, response) => {
  try {
    const { postId, userId, reason } = request.body;
    if (!postId || !userId || !reason) return response.status(400).json({ message: "postId, userId and reason are required" });

    const post = await Post.findById(postId);
    if (!post) return response.status(404).json({ message: "Post not found" });

    post.reports = post.reports || [];
    post.reports.push({ userId, reason, date: new Date() });
    await post.save();

    // In production: create a moderation job/notification here
    return response.status(200).json({ message: "Report submitted", result: post });
  } catch (e) {
    return response.status(500).json({ message: e.message });
  }
};

// Boost Post (seller pays to boost; here we just set boostedUntil date)
export const boostPost = async (request, response) => {
  try {
    const { postId, sellerId, days } = request.body;
    if (!postId || !sellerId || !days) return response.status(400).json({ message: "postId, sellerId and days required" });

    const post = await Post.findById(postId);
    if (!post) return response.status(404).json({ message: "Post not found" });
    if (post.sellerId.toString() !== sellerId.toString()) return response.status(403).json({ message: "Only seller can boost their post" });

    const now = new Date();
    const currentBoost = post.boostedUntil && post.boostedUntil > now ? post.boostedUntil : now;
    const newBoostUntil = new Date(currentBoost.getTime() + Number(days) * 24 * 60 * 60 * 1000);

    post.boostedUntil = newBoostUntil;
    await post.save();

    return response.status(200).json({ message: "Post boosted", boostedUntil: post.boostedUntil, result: post });
  } catch (e) {
    return response.status(500).json({ message: e.message });
  }
};

// Follow a seller (simple endpoint - this requires a `following` array on User model or a separate Follows collection)
export const followSeller = async (request, response) => {
  try {
    const { userId, sellerId } = request.body;
    if (!userId || !sellerId) return response.status(400).json({ message: "userId and sellerId required" });

    const user = await User.findById(userId);
    const seller = await User.findById(sellerId);
    if (!user || !seller) return response.status(404).json({ message: "User or seller not found" });

    // For simplicity, we store following in `user.following` — make sure User model has it.
    user.following = user.following || [];
    const already = user.following.some(id => id.toString() === sellerId.toString());
    if (already) user.following = user.following.filter(id => id.toString() !== sellerId.toString());
    else user.following.push(sellerId);

    await user.save();

    return response.status(200).json({ message: already ? "Unfollowed" : "Followed", result: user });
  } catch (e) {
    return response.status(500).json({ message: e.message });
  }
};

// Get Seller Profile with basic stats (posts count, avg likes per post) — useful for trust signals
export const getSellerProfile = async (request, response) => {
  try {
    const { sellerId } = request.params;
    const seller = await User.findById(sellerId).select("name profileImage");
    if (!seller) return response.status(404).json({ message: "Seller not found" });

    const stats = await Post.aggregate([
      { $match: { sellerId: seller._id } },
      { $project: { likesCount: { $size: { $ifNull: ["$likes", []] } } } },
      { $group: { _id: null, posts: { $sum: 1 }, avgLikes: { $avg: "$likesCount" } } }
    ]);

    const result = stats[0] || { posts: 0, avgLikes: 0 };

    return response.status(200).json({ message: "Seller profile", seller, stats: result });
  } catch (e) {
    return response.status(500).json({ message: e.message });
  }
};

// Existing helpers: Like/Unlike and Comments remain useful — keep previous implementations
export const toggleLikePost = async (request, response) => {
  try {
    const { postId, userId } = request.body;

    if (!postId || !userId) {
      return response.status(400).json({ message: "postId and userId are required" });
    }

    const post = await Post.findById(postId);
    if (!post) return response.status(404).json({ message: "Post not found" });

    const alreadyLiked = post.likes.some(id => id.toString() === userId.toString());

    if (alreadyLiked) {
      post.likes.pull(userId);
    } else {
      post.likes.push(userId);
    }

    await post.save();

    return response.status(200).json({ message: alreadyLiked ? "Post unliked" : "Post liked", result: post });
  } catch (e) {
    return response.status(500).json({ message: e.message });
  }
};

export const addComment = async (request, response) => {
  try {
    const { postId, userId, userName, text } = request.body;

    if (!postId || !userId || !userName || !text) {
      return response.status(400).json({ message: "postId, userId, userName, and text are required" });
    }

    const post = await Post.findById(postId);
    if (!post) return response.status(404).json({ message: "Post not found" });

    post.comments.push({ userId, userName, text });
    await post.save();

    return response.status(201).json({ message: "Comment added", result: post });
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
    if (!comment) return response.status(404).json({ message: "Comment not found" });

    comment.remove();
    await post.save();

    return response.status(200).json({ message: "Comment deleted", result: post });
  } catch (e) {
    return response.status(500).json({ message: e.message });
  }
};

export const deletePost = async (request, response) => {
  try {
    const { id } = request.params;
    const deleted = await Post.findByIdAndDelete(id);

    if (!deleted) return response.status(404).json({ message: "Post not found" });

    return response.status(200).json({ message: "Post deleted successfully" });
  } catch (e) {
    return response.status(500).json({ message: e.message });
  }
};

/*
- Add fields to Post model: title, description, price(Number), category(String), location{type: 'Point', coordinates:[lng,lat]}, boostedUntil(Date), savedBy:[ObjectId], reports:[{userId,reason,date}]
- Add text index on fields you want searchable: title, description.
- Add 2dsphere index on Post.location for geo queries.
- Add `following` array to User model to support followSeller.
- Add billing/microtransaction flow to accept payments for boostPost.
- Add a Moderation collection to queue reports for human review.
- Saved searches & alerts (notify user when new post matches filters)
- Chat between buyer & seller with message history and read receipts
- In-app offers: allow buyers to send an offer price — store offers on Post or separate Offers collection
- Auto-moderation: flag posts with banned words or too many reports
- Seller verification badges and ratings
- Recommendation engine: show related posts using simple collaborative filtering or content similarity
*/
