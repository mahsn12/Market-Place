import express from "express";
import {
  createPost,
  getAllPosts,
  searchPosts,
  getTrendingPosts,
  toggleSavePost,
  reportPost,
  boostPost,
  followSeller,
  getSellerProfile,
  toggleLikePost,
  addComment,
  deleteComment,
  deletePost,
} from "../Controller/PostController.js";

const router = express.Router();

router.post("/create", createPost);

router.get("/all", getAllPosts);

router.get("/search", searchPosts);

router.get("/trending", getTrendingPosts);

router.patch("/save", toggleSavePost);

router.post("/report", reportPost);

router.patch("/boost", boostPost);

router.post("/follow", followSeller);

router.get("/seller/profile/:sellerId", getSellerProfile);

router.patch("/like", toggleLikePost);

router.post("/comment/add", addComment);

router.delete("/comment/:postId/:commentId", deleteComment);

router.delete("/delete/:id", deletePost);

export default router;
