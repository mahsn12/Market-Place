import mongoose from "mongoose";

const orderSchema = mongoose.Schema(
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

    products: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        price: {
          type: Number,
          required: true,
        },
      },
    ],

    totalPrice: {
      type: Number,
      required: true,
    },

    // zyadat mn chatgpt 3ashan el payment status

    paid: {
      type: Boolean,
      default: false,
    },

    paymentInfo: {
      provider: { type: String }, // e.g., 'stripe'
      providerId: { type: String }, // payment_intent_id, checkout_session_id
      status: { type: String }, // 'pending', 'succeeded', 'failed'
    },

    refunded: {
      type: Boolean,
      default: false,
    },

    timeline: [
      {
        status: { type: String, required: true },
        date: { type: Date, default: Date.now },
        by: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // sellerId, buyerId, or system
      },
    ],

    status: {
      type: String,
      enum: ["Pending", "Shipped", "Delivered", "Cancelled"],
      default: "Pending",
    },

    orderDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.model("Order", orderSchema);
export default Order;
