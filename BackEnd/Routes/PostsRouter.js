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
   getCategories,
  getSellerProfile,
  getPostsBySeller,
  toggleLikePost,
  addComment,
  deleteComment,
  addReply,
  deleteReply,
  deletePost,
  searchPostsByTitlePrefixController ,
} from "../Controller/PostController.js";
import { authMiddleware } from "../Middleware/auth.js";

const router = express.Router();

/* =========================
   POSTS CRUD
========================= */

router.post("/create", authMiddleware, createPost);
router.patch("/update/:id", authMiddleware, updatePost);
router.delete("/delete/:id", authMiddleware, deletePost);

/* =========================
   POSTS FETCHING
========================= */

router.get("/all", getAllPosts);
router.get("/search", searchPosts);
router.get("/trending", getTrendingPosts);
router.get("/categories", getCategories);

/* =========================
   POST INTERACTIONS (AUTH)
========================= */

router.patch("/save", authMiddleware, toggleSavePost);
router.patch("/like", authMiddleware, toggleLikePost);
router.post("/report", authMiddleware, reportPost);
router.patch("/boost", authMiddleware, boostPost);

/* =========================
   COMMENTS & REPLIES (AUTH)
========================= */

router.post("/comment/add", authMiddleware, addComment);
router.delete(
  "/comment/:postId/:commentId",
  authMiddleware,
  deleteComment
);

router.post("/reply/add", authMiddleware, addReply);
router.delete(
  "/reply/:postId/:commentId/:replyId",
  authMiddleware,
  deleteReply
);

/* =========================
   SELLER / SOCIAL
========================= */

router.post("/follow", authMiddleware, followSeller);
router.get("/seller/profile/:sellerId", getSellerProfile);
router.get("/seller/:sellerId", getPostsBySeller);
router.get("/search-prefix", searchPostsByTitlePrefixController );

export default router;
