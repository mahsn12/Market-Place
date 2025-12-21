import mongoose from "mongoose";

const postSchema = mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // el marketplace fields
    title: {
      type: String,
      required: true,
      text: true,
    },

    description: {
      type: String,
      text: true,
    },

    price: {
      type: Number,
      required: false,
    },


    category: {
      type: String,
      required: false,
      index: true,
    },
    
    quantity: {
    type: Number,
    default: 1,
    min: 0,
   },

    condition: {
      type: String,
      enum: ["new", "like new", "good", "fair"],
      default: "good",
    },

    // Location as simple string
    location: {
      type: String,
      default: "",
    },

    date: {
      type: Date,
      default: Date.now,
    },

    images: [
      {
        type: String,
        required: true,
      },
    ],

    // stats w engagement
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    comments: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        userName: {
          type: String,
          required: true,
        },
        userProfileImage: {
          type: String,
          default: null,
        },
        text: {
          type: String,
          required: true,
        },
        date: {
          type: Date,
          default: Date.now,
        },
        replies: [
          {
            userId: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "User",
              required: true,
            },
            userName: {
              type: String,
              required: true,
            },
            userProfileImage: {
              type: String,
              default: null,
            },
            text: {
              type: String,
              required: true,
            },
            date: {
              type: Date,
              default: Date.now,
            },
          },
        ],
      },
    ],

    // savedBy removed — bookmarking removed

    // reporting
    reports: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        reason: String,
        date: { type: Date, default: Date.now },
      },
    ],

    // paid ad
    boostedUntil: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// mn chatgpt bs azon bta3t search fel name w description
postSchema.index({ title: "text", description: "text" });

const Post = mongoose.model("Post", postSchema);
export default Post;
