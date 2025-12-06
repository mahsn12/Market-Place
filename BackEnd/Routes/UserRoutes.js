import express from "express";
import {
  registerUser,
  loginUser,
  getAllUsers,
  GetUser,
  UpdateUser,
  DeleteUser,
  searchByNameOrEmail,
  addToCart,
  removeFromCart,
} from "../Controller/UserController.js";
import { authMiddleware } from "../Middleware/auth.js";

const router = express.Router();

// AUTH
router.post("/register", registerUser);
router.post("/login", loginUser);

// GET ALL USERS
router.get("/all", authMiddleware , getAllUsers);
     
// GET ONE USER
router.get("/profile/:id", authMiddleware, GetUser);

// SEARCH
router.get("/search/:query", authMiddleware, searchByNameOrEmail);

// UPDATE USER
router.patch("/update", authMiddleware, UpdateUser);

// DELETE USER
router.delete("/delete/:id", authMiddleware, DeleteUser);

// CART
router.patch("/cart/add", authMiddleware, addToCart);
router.patch("/cart/remove", authMiddleware, removeFromCart);

export default router;