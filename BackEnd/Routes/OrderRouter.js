import express from "express";
import {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrder,
  updateOrderStatus,
  deleteOrder,
  getOrdersByBuyer,
  getOrdersBySeller,
  paymentWebhook,
  getSalesSummary
} from "../Controller/OrderController.js";
import { authMiddleware } from "../Middleware/auth.js";

const router = express.Router();

router.post("/create", authMiddleware, createOrder);

router.get("/all", getAllOrders);

router.get("/id/:id", getOrderById);

router.put("/update/:id", updateOrder);

router.patch("/status/:id", updateOrderStatus);

router.delete("/cancel/:id", deleteOrder);

router.get("/buyer/:buyerId", getOrdersByBuyer);

router.get("/seller/:sellerId", getOrdersBySeller);

router.post("/payment/webhook", paymentWebhook);

router.get("/seller/analytics", getSalesSummary);

export default router;
