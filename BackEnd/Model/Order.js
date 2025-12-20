import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
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

    // 📦 Shipping Address (FIXED & REQUIRED)
    shippingAddress: {
      fullName: {
        type: String,
        required: true,
      },
      phone: {
        type: String,
        required: true,
      },
      street: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      state: {
        type: String,
      },
      country: {
        type: String,
        default: "Egypt",
      },
      postalCode: {
        type: String,
      },
    },

    // 🛒 Items (POSTS, not products)
    items: [
      {
        postId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Post",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        price: {
          type: Number,
          required: true, // price snapshot at purchase time
        },
      },
    ],

    totalPrice: {
      type: Number,
      required: true,
    },

    // 💳 Payment State
    paid: {
      type: Boolean,
      default: false,
    },

    paymentInfo: {
      provider: { type: String },     // e.g. "stripe"
      providerId: { type: String },   // payment_intent_id
      status: { type: String },       // pending | succeeded | failed
    },

    refunded: {
      type: Boolean,
      default: false,
    },

    // 🕒 Order Timeline (audit log)
    timeline: [
      {
        status: {
          type: String,
          required: true,
        },
        date: {
          type: Date,
          default: Date.now,
        },
        by: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      },
    ],

    status: {
      type: String,
      enum: ["Pending", "Shipped", "Delivered", "Cancelled"],
      default: "Pending",
    },

    orderDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.model("Order", orderSchema);
export default Order;
