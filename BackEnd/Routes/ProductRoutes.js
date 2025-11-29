import express from "express";
import {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  toggleSaveProduct,
  reportProduct,
  boostProduct,
  addProductReview // we'll create this next
} from "../Controller/ProductController.js";

const router = express.Router();

// Create a new product
router.post("/", createProduct);

// Get all products (supports filters)
router.get("/", getAllProducts);

// Get single product (auto-increments views)
router.get("/:id", getProductById);

// Add review to a product
router.post("/:id/reviews", addProductReview);

// Update product
router.put("/:id", updateProduct);

// Delete product
router.delete("/:id", deleteProduct);

// Toggle Saved status (Wishlist)
router.patch("/:id/save", toggleSaveProduct);

// Report a product
router.post("/:id/report", reportProduct);

// Boost a product (Simulate paid feature)
router.patch("/:id/boost", boostProduct);

export default router;
