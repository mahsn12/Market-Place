import express from "express";
import {
  createPost,
  updatePost,
  getAllPosts,
  searchPosts,
  getTrendingPosts,
  toggleSavePost,
  reportPost,
  boostPost,
  followSeller,
  getSellerProfile,
  getPostsBySeller,
  toggleLikePost,
  addComment,
  deleteComment,
  addReply,
  deleteReply,
  deletePost,
} from "../Controller/PostController.js";
import { authMiddleware } from "../Middleware/auth.js";

const router = express.Router();

router.post("/create", authMiddleware, createPost);

router.patch("/update/:id", authMiddleware, updatePost);

router.get("/all", getAllPosts);

router.get("/search", searchPosts);

router.get("/trending", getTrendingPosts);

router.patch("/save", toggleSavePost);

router.post("/report", reportPost);

router.patch("/boost", boostPost);

router.post("/follow", followSeller);

router.get("/seller/profile/:sellerId", getSellerProfile);

router.get("/seller/:sellerId", getPostsBySeller);

router.patch("/like", toggleLikePost);

router.post("/comment/add", addComment);

router.delete("/comment/:postId/:commentId", deleteComment);

router.post("/reply/add", addReply);

router.delete("/reply/:postId/:commentId/:replyId", deleteReply);

router.delete("/delete/:id", authMiddleware, deletePost);

export default router;
