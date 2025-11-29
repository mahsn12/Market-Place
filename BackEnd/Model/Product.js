import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    name: {
      type: String,
      required: true,
      text: true
    },

    description: {
      type: String,
      required: true,
      text: true
    },

    price: {
      type: Number,
      required: true,
      min: 0
    },

    // 5alet el image arrays 3ashan kaza sora
    images: [
      {
        type: String,
        required: false
      }
    ],

    // el stock w el status fel OrderController
    stock: {
      type: Number,
      required: true,
      min: 0
    },

    status: {
      type: String,
      enum: ["available", "sold"],
      default: "available"
    },

    category: {
      type: String,
      required: true,
      index: true
    },

    condition: {
      type: String,
      enum: ["new", "like new", "used", "refurbished"],
      default: "used"
    },

    // search bs bl location
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point"
      },
      coordinates: {
        type: [Number], // [lng, lat]
        default: undefined
      }
    },

    // stats w keda 
    views: {
      type: Number,
      default: 0
    },

    savedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],
    reviews: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      comment: String,
      date: { type: Date, default: Date.now }
    }
    ],
    
    reports: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        reason: String,
        date: { type: Date, default: Date.now }
      }
    ],

    boostedUntil: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

// mn chatgpt bs azon bta3t search fel name w description
productSchema.index({ name: "text", description: "text" });

// mnn brdo chatgpt bta3et location
productSchema.index({ location: "2dsphere" });

const Product = mongoose.model("Product", productSchema);
export default Product;
