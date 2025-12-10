import express from "express";
import {
  createProduct,
  updateProduct,
  deleteProduct,
  getProduct,
  filterAndSearch,
  reportProduct,
  getProductsBySeller
} from "../Controller/ProductController.js";
import { authMiddleware } from "../Middleware/auth.js";

const router = express.Router();

// CREATE
router.post("/create", authMiddleware, createProduct);

// GET ALL + FILTER
router.get("/all", filterAndSearch);

// GET ONE
router.get("/single/:id", getProduct);

// UPDATE (seller only)
router.patch("/update", authMiddleware, updateProduct);

// DELETE (seller only)
router.delete("/delete/:id", authMiddleware, deleteProduct);

// GET BY SELLER
router.get("/seller/:sellerId", getProductsBySeller);

// REPORT PRODUCT
router.post("/report", authMiddleware, reportProduct);

export default router;
