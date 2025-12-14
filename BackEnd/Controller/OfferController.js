import { request, response } from "express";
import Offer from "../Model/Offer.js";
import Post from "../Model/Post.js";
import User from "../Model/User.js";

// Create offer (buyer submits offer)
export const createOffer = async (request, response) => {
  try {
    const { id } = request.user;
    const { postId, offerAmount, message } = request.body;

    if (!postId || !offerAmount) {
      return response
        .status(400)
        .json({ message: "postId and offerAmount are required" });
    }

    if (offerAmount <= 0) {
      return response
        .status(400)
        .json({ message: "Offer amount must be greater than 0" });
    }

    // Get post details
    const post = await Post.findById(postId).populate("sellerId", "name email");
    if (!post) {
      return response.status(404).json({ message: "Post not found" });
    }

    // Check if buyer is trying to offer on their own post
    if (post.sellerId._id.toString() === id.toString()) {
      return response
        .status(400)
        .json({ message: "Cannot make offer on your own listing" });
    }

    // Check if there's already a pending offer from this buyer
    const existingOffer = await Offer.findOne({
      postId,
      buyerId: id,
      status: "pending",
    });

    if (existingOffer) {
      return response
        .status(400)
        .json({ message: "You already have a pending offer on this listing" });
    }

    // Create offer
    const offer = new Offer({
      postId,
      buyerId: id,
      sellerId: post.sellerId._id,
      offerAmount,
      originalPrice: post.price,
      message,
    });

    await offer.save();
    await offer.populate("buyerId", "name profileImage verified");
    await offer.populate("postId", "title images price");

    return response.status(201).json({
      message: "Offer submitted successfully",
      result: offer,
    });
  } catch (e) {
    return response.status(500).json({ message: e.message });
  }
};

// Get offers for a post (seller/buyer view)
export const getOffersForPost = async (request, response) => {
  try {
    const { postId } = request.params;
    const { id } = request.user;

    const post = await Post.findById(postId);
    if (!post) {
      return response.status(404).json({ message: "Post not found" });
    }

    // Only seller or buyers who made offers can see offers
    const query = { postId };

    const offers = await Offer.find(query)
      .populate("buyerId", "name profileImage verified")
      .populate("sellerId", "name profileImage")
      .populate("postId", "title images price")
      .sort({ createdAt: -1 });

    // Filter: if user is seller, show all offers. If buyer, show only their offers
    const filteredOffers = offers.filter((offer) => {
      return (
        offer.sellerId._id.toString() === id.toString() ||
        offer.buyerId._id.toString() === id.toString()
      );
    });

    return response.status(200).json({
      message: "Offers retrieved",
      result: filteredOffers,
    });
  } catch (e) {
    return response.status(500).json({ message: e.message });
  }
};

// Get all offers made by buyer
export const getBuyerOffers = async (request, response) => {
  try {
    const { id } = request.user;
    const page = parseInt(request.query.page) || 1;
    const limit = parseInt(request.query.limit) || 10;
    const skip = (page - 1) * limit;

    const offers = await Offer.find({ buyerId: id })
      .populate("sellerId", "name profileImage verified")
      .populate("postId", "title images price")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Offer.countDocuments({ buyerId: id });

    return response.status(200).json({
      message: "Buyer offers retrieved",
      page,
      limit,
      total,
      result: offers,
    });
  } catch (e) {
    return response.status(500).json({ message: e.message });
  }
};

// Get all offers received by seller
export const getSellerOffers = async (request, response) => {
  try {
    const { id } = request.user;
    const page = parseInt(request.query.page) || 1;
    const limit = parseInt(request.query.limit) || 10;
    const skip = (page - 1) * limit;

    const offers = await Offer.find({ sellerId: id })
      .populate("buyerId", "name profileImage verified")
      .populate("postId", "title images price")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Offer.countDocuments({ sellerId: id });

    return response.status(200).json({
      message: "Seller offers retrieved",
      page,
      limit,
      total,
      result: offers,
    });
  } catch (e) {
    return response.status(500).json({ message: e.message });
  }
};

// Accept offer (seller)
export const acceptOffer = async (request, response) => {
  try {
    const { id } = request.user;
    const { offerId } = request.params;

    const offer = await Offer.findById(offerId)
      .populate("buyerId", "name email")
      .populate("postId", "title images");

    if (!offer) {
      return response.status(404).json({ message: "Offer not found" });
    }

    // Check if user is the seller
    if (offer.sellerId.toString() !== id.toString()) {
      return response.status(403).json({ message: "Unauthorized" });
    }

    // Check if offer is still pending
    if (offer.status !== "pending" && offer.status !== "countered") {
      return response
        .status(400)
        .json({ message: "Offer is no longer pending" });
    }

    // Update offer status
    offer.status = "accepted";
    offer.respondedAt = new Date();
    await offer.save();

    // Reject all other pending offers for this post
    await Offer.updateMany(
      {
        postId: offer.postId,
        _id: { $ne: offerId },
        status: { $in: ["pending", "countered"] },
      },
      {
        $set: { status: "rejected", respondedAt: new Date() },
      }
    );

    return response.status(200).json({
      message: "Offer accepted",
      result: offer,
    });
  } catch (e) {
    return response.status(500).json({ message: e.message });
  }
};

// Reject offer (seller)
export const rejectOffer = async (request, response) => {
  try {
    const { id } = request.user;
    const { offerId } = request.params;
    const { message } = request.body;

    const offer = await Offer.findById(offerId)
      .populate("buyerId", "name email")
      .populate("postId", "title");

    if (!offer) {
      return response.status(404).json({ message: "Offer not found" });
    }

    // Check if user is the seller
    if (offer.sellerId.toString() !== id.toString()) {
      return response.status(403).json({ message: "Unauthorized" });
    }

    // Check if offer is still pending
    if (offer.status !== "pending" && offer.status !== "countered") {
      return response
        .status(400)
        .json({ message: "Offer is no longer pending" });
    }

    // Update offer status
    offer.status = "rejected";
    offer.respondedAt = new Date();
    if (message) {
      offer.message = message;
    }
    await offer.save();

    return response.status(200).json({
      message: "Offer rejected",
      result: offer,
    });
  } catch (e) {
    return response.status(500).json({ message: e.message });
  }
};

// Counter offer (seller)
export const counterOffer = async (request, response) => {
  try {
    const { id } = request.user;
    const { offerId } = request.params;
    const { counterAmount, message } = request.body;

    if (!counterAmount || counterAmount <= 0) {
      return response
        .status(400)
        .json({ message: "Valid counter amount is required" });
    }

    const offer = await Offer.findById(offerId)
      .populate("buyerId", "name email")
      .populate("postId", "title");

    if (!offer) {
      return response.status(404).json({ message: "Offer not found" });
    }

    // Check if user is the seller
    if (offer.sellerId.toString() !== id.toString()) {
      return response.status(403).json({ message: "Unauthorized" });
    }

    // Check if offer is still pending
    if (offer.status !== "pending") {
      return response
        .status(400)
        .json({ message: "Can only counter pending offers" });
    }

    // Update offer with counter offer
    offer.status = "countered";
    offer.counterOffer = {
      amount: counterAmount,
      message: message || "",
      createdAt: new Date(),
    };
    offer.respondedAt = new Date();
    await offer.save();

    return response.status(200).json({
      message: "Counter offer sent",
      result: offer,
    });
  } catch (e) {
    return response.status(500).json({ message: e.message });
  }
};

// Accept counter offer (buyer)
export const acceptCounterOffer = async (request, response) => {
  try {
    const { id } = request.user;
    const { offerId } = request.params;

    const offer = await Offer.findById(offerId)
      .populate("sellerId", "name email")
      .populate("postId", "title");

    if (!offer) {
      return response.status(404).json({ message: "Offer not found" });
    }

    // Check if user is the buyer
    if (offer.buyerId.toString() !== id.toString()) {
      return response.status(403).json({ message: "Unauthorized" });
    }

    // Check if offer has a counter offer
    if (offer.status !== "countered") {
      return response
        .status(400)
        .json({ message: "No counter offer to accept" });
    }

    // Update offer status
    offer.status = "accepted";
    offer.offerAmount = offer.counterOffer.amount;
    offer.respondedAt = new Date();
    await offer.save();

    // Reject all other pending offers for this post
    await Offer.updateMany(
      {
        postId: offer.postId,
        _id: { $ne: offerId },
        status: { $in: ["pending", "countered"] },
      },
      {
        $set: { status: "rejected", respondedAt: new Date() },
      }
    );

    return response.status(200).json({
      message: "Counter offer accepted",
      result: offer,
    });
  } catch (e) {
    return response.status(500).json({ message: e.message });
  }
};

// Withdraw offer (buyer)
export const withdrawOffer = async (request, response) => {
  try {
    const { id } = request.user;
    const { offerId } = request.params;

    const offer = await Offer.findById(offerId);

    if (!offer) {
      return response.status(404).json({ message: "Offer not found" });
    }

    // Check if user is the buyer
    if (offer.buyerId.toString() !== id.toString()) {
      return response.status(403).json({ message: "Unauthorized" });
    }

    // Check if offer can be withdrawn
    if (offer.status === "accepted") {
      return response
        .status(400)
        .json({ message: "Cannot withdraw accepted offer" });
    }

    // Update offer status
    offer.status = "withdrawn";
    offer.respondedAt = new Date();
    await offer.save();

    return response.status(200).json({
      message: "Offer withdrawn",
      result: offer,
    });
  } catch (e) {
    return response.status(500).json({ message: e.message });
  }
};

// Get offer statistics (for seller dashboard)
export const getOfferStats = async (request, response) => {
  try {
    const { id } = request.user;

    const stats = await Offer.aggregate([
      { $match: { sellerId: id } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const formattedStats = {
      pending: 0,
      accepted: 0,
      rejected: 0,
      countered: 0,
      withdrawn: 0,
      total: 0,
    };

    stats.forEach((stat) => {
      formattedStats[stat._id] = stat.count;
      formattedStats.total += stat.count;
    });

    return response.status(200).json({
      message: "Offer stats retrieved",
      result: formattedStats,
    });
  } catch (e) {
    return response.status(500).json({ message: e.message });
  }
};
