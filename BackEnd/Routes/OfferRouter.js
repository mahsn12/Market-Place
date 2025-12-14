import express from "express";
import { authMiddleware } from "../Middleware/auth.js";
import {
  createOffer,
  getOffersForPost,
  getBuyerOffers,
  getSellerOffers,
  acceptOffer,
  rejectOffer,
  counterOffer,
  acceptCounterOffer,
  withdrawOffer,
  getOfferStats,
} from "../Controller/OfferController.js";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Create offer
router.post("/create", createOffer);

// Get offers
router.get("/post/:postId", getOffersForPost);
router.get("/buyer", getBuyerOffers);
router.get("/seller", getSellerOffers);
router.get("/stats", getOfferStats);

// Seller actions
router.post("/accept/:offerId", acceptOffer);
router.post("/reject/:offerId", rejectOffer);
router.post("/counter/:offerId", counterOffer);

// Buyer actions
router.post("/accept-counter/:offerId", acceptCounterOffer);
router.post("/withdraw/:offerId", withdrawOffer);

export default router;
