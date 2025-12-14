import express from "express";
import { authMiddleware } from "../Middleware/auth.js";
import {
  getConversations,
  getMessages,
  sendMessage,
  deleteMessage,
  blockUser,
  unblockUser,
  startConversation,
  getUnreadCount,
} from "../Controller/MessageController.js";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Conversation routes
router.get("/conversations", getConversations);
router.post("/start-conversation", startConversation);
router.get("/unread-count", getUnreadCount);

// Message routes
router.get("/messages/:conversationId", getMessages);
router.post("/send", sendMessage);
router.delete("/messages/:messageId", deleteMessage);

// Block routes
router.post("/block", blockUser);
router.post("/unblock", unblockUser);

export default router;
