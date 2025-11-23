import mongoose from "mongoose";

const postSchema = mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    // el marketplace fields
    title: {
      type: String,
      required: true,
      text: true
    },

    description: {
      type: String,
      text: true
    },

    price: {
      type: Number,
      required: false
    },

    category: {
      type: String,
      required: false,
      index: true
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

    date: {
      type: Date,
      default: Date.now
    },

    images: [
      {
        type: String,
        required: true
      }
    ],

    // stats w engagement
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],

    comments: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true
        },
        userName: {
          type: String,
          required: true
        },
        text: {
          type: String,
          required: true
        },
        date: {
          type: Date,
          default: Date.now
        }
      }
    ],

    // Saved posts
    savedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],

    // reporting  
    reports: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        reason: String,
        date: { type: Date, default: Date.now }
      }
    ],

    // paid ad
    boostedUntil: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

// mn chatgpt bs azon bta3t search fel name w description
postSchema.index({ title: "text", description: "text" });

//mnn brdo chatgpt bta3et location
postSchema.index({ location: "2dsphere" });

const Post = mongoose.model("Post", postSchema);
export default Post;
