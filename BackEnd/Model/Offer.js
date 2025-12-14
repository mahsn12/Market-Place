import mongoose from "mongoose";

const offerSchema = new mongoose.Schema(
  {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
      index: true,
    },
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    offerAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    originalPrice: {
      type: Number,
      required: true,
    },
    message: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "countered", "withdrawn"],
      default: "pending",
    },
    counterOffer: {
      amount: {
        type: Number,
        min: 0,
      },
      message: {
        type: String,
        trim: true,
        maxlength: 500,
      },
      createdAt: {
        type: Date,
      },
    },
    respondedAt: {
      type: Date,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  },
  { timestamps: true }
);

// Indexes for efficient querying
offerSchema.index({ postId: 1, buyerId: 1, status: 1 });
offerSchema.index({ sellerId: 1, status: 1, createdAt: -1 });
offerSchema.index({ buyerId: 1, status: 1, createdAt: -1 });
offerSchema.index({ expiresAt: 1 });

export default mongoose.model("Offer", offerSchema);
