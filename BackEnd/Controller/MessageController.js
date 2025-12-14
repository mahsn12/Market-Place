import { request, response } from "express";
import Message from "../Model/Message.js";
import Conversation from "../Model/Conversation.js";
import User from "../Model/User.js";

// Helper: Get or create conversation
const getOrCreateConversation = async (userId, otherUserId, postId = null) => {
  let conversation = await Conversation.findOne({
    participants: { $all: [userId, otherUserId] },
  }).populate("lastMessage");

  if (!conversation) {
    conversation = new Conversation({
      participants: [userId, otherUserId],
      postId,
      unreadCounts: new Map([
        [userId.toString(), 0],
        [otherUserId.toString(), 0],
      ]),
    });
    await conversation.save();
  }

  return conversation;
};

// Get all conversations for user
export const getConversations = async (request, response) => {
  try {
    const { id } = request.user;

    const conversations = await Conversation.find({
      participants: id,
    })
      .populate("participants", "name profileImage verified")
      .populate("lastMessage")
      .populate("postId", "title images")
      .sort({ lastMessageAt: -1 });

    // Filter out blocked conversations
    const activeConversations = conversations.filter(
      (conv) => !conv.blockedBy || conv.blockedBy.toString() !== id.toString()
    );

    // Return with other user info and unread count
    const formattedConversations = activeConversations.map((conv) => {
      const otherUser = conv.participants.find(
        (p) => p._id.toString() !== id.toString()
      );
      const unreadCount = conv.unreadCounts?.get(id.toString()) || 0;

      return {
        _id: conv._id,
        otherUser,
        lastMessage: conv.lastMessage,
        lastMessageAt: conv.lastMessageAt,
        postId: conv.postId,
        unreadCount,
        blockedBy: conv.blockedBy,
      };
    });

    return response.status(200).json({
      message: "Conversations retrieved",
      result: formattedConversations,
    });
  } catch (e) {
    return response.status(500).json({ message: e.message });
  }
};

// Get messages in conversation
export const getMessages = async (request, response) => {
  try {
    const { conversationId } = request.params;
    const { id } = request.user;
    const page = parseInt(request.query.page) || 1;
    const limit = parseInt(request.query.limit) || 30;
    const skip = (page - 1) * limit;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation)
      return response.status(404).json({ message: "Conversation not found" });

    // Check if user is part of conversation
    if (!conversation.participants.some((p) => p.toString() === id.toString())) {
      return response.status(403).json({ message: "Unauthorized" });
    }

    // Check if blocked
    if (
      conversation.blockedBy &&
      conversation.blockedBy.toString() === id.toString()
    ) {
      return response.status(403).json({ message: "You have blocked this user" });
    }

    const messages = await Message.find({
      conversationId,
      deletedBy: { $ne: id },
    })
      .populate("senderId", "name profileImage verified")
      .populate("receiverId", "name profileImage verified")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Mark messages as read
    await Message.updateMany(
      {
        conversationId,
        receiverId: id,
        isRead: false,
      },
      {
        $set: { isRead: true, readAt: new Date() },
      }
    );

    // Update conversation unread count
    await Conversation.findByIdAndUpdate(conversationId, {
      $set: { [`unreadCounts.${id}`]: 0 },
    });

    return response.status(200).json({
      message: "Messages retrieved",
      page,
      limit,
      result: messages.reverse(), // Return in chronological order
    });
  } catch (e) {
    return response.status(500).json({ message: e.message });
  }
};

// Send message
export const sendMessage = async (request, response) => {
  try {
    const { id } = request.user;
    const { receiverId, conversationId, content, attachments, postId } =
      request.body;

    if (!content || !content.trim()) {
      return response
        .status(400)
        .json({ message: "Message content is required" });
    }

    if (!receiverId) {
      return response.status(400).json({ message: "Receiver ID is required" });
    }

    // Get or create conversation
    let conversation;
    if (conversationId) {
      conversation = await Conversation.findById(conversationId);
    } else {
      conversation = await getOrCreateConversation(id, receiverId, postId);
    }

    if (!conversation) {
      return response.status(400).json({ message: "Conversation not found" });
    }

    // Check if conversation is blocked
    if (conversation.blockedBy?.toString() === id.toString()) {
      return response
        .status(403)
        .json({ message: "You cannot send messages in a blocked conversation" });
    }

    // Create message
    const message = new Message({
      conversationId: conversation._id,
      senderId: id,
      receiverId,
      content: content.trim(),
      attachments: attachments || [],
    });

    await message.save();
    await message.populate("senderId", "name profileImage verified");
    await message.populate("receiverId", "name profileImage verified");

    // Update conversation
    await Conversation.findByIdAndUpdate(conversation._id, {
      lastMessage: message._id,
      lastMessageAt: new Date(),
      $inc: { [`unreadCounts.${receiverId}`]: 1 },
    });

    return response.status(201).json({
      message: "Message sent",
      result: message,
    });
  } catch (e) {
    return response.status(500).json({ message: e.message });
  }
};

// Delete message
export const deleteMessage = async (request, response) => {
  try {
    const { messageId } = request.params;
    const { id } = request.user;

    const message = await Message.findById(messageId);
    if (!message)
      return response.status(404).json({ message: "Message not found" });

    // Only sender can delete
    if (message.senderId.toString() !== id.toString()) {
      return response.status(403).json({ message: "Unauthorized" });
    }

    // Soft delete - add user to deletedBy array
    await Message.findByIdAndUpdate(messageId, {
      $addToSet: { deletedBy: id },
    });

    return response.status(200).json({ message: "Message deleted" });
  } catch (e) {
    return response.status(500).json({ message: e.message });
  }
};

// Block user
export const blockUser = async (request, response) => {
  try {
    const { conversationId, blockUserId } = request.body;
    const { id } = request.user;

    if (!conversationId || !blockUserId) {
      return response
        .status(400)
        .json({ message: "conversationId and blockUserId required" });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation)
      return response.status(404).json({ message: "Conversation not found" });

    // Update conversation to mark as blocked by current user
    await Conversation.findByIdAndUpdate(conversationId, {
      blockedBy: id,
    });

    return response.status(200).json({ message: "User blocked" });
  } catch (e) {
    return response.status(500).json({ message: e.message });
  }
};

// Unblock user
export const unblockUser = async (request, response) => {
  try {
    const { conversationId } = request.body;
    const { id } = request.user;

    if (!conversationId) {
      return response.status(400).json({ message: "conversationId required" });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation)
      return response.status(404).json({ message: "Conversation not found" });

    // Check if this user blocked the conversation
    if (conversation.blockedBy?.toString() !== id.toString()) {
      return response.status(403).json({ message: "You didn't block this conversation" });
    }

    await Conversation.findByIdAndUpdate(conversationId, {
      blockedBy: null,
    });

    return response.status(200).json({ message: "User unblocked" });
  } catch (e) {
    return response.status(500).json({ message: e.message });
  }
};

// Start conversation from post
export const startConversation = async (request, response) => {
  try {
    const { id } = request.user;
    const { sellerId, postId } = request.body;

    if (!sellerId || !postId) {
      return response
        .status(400)
        .json({ message: "sellerId and postId required" });
    }

    if (id.toString() === sellerId.toString()) {
      return response
        .status(400)
        .json({ message: "Cannot message yourself" });
    }

    const conversation = await getOrCreateConversation(id, sellerId, postId);

    return response.status(200).json({
      message: "Conversation started",
      result: conversation,
    });
  } catch (e) {
    return response.status(500).json({ message: e.message });
  }
};

// Get unread count
export const getUnreadCount = async (request, response) => {
  try {
    const { id } = request.user;

    const conversations = await Conversation.find({
      participants: id,
    });

    const totalUnread = conversations.reduce((sum, conv) => {
      return sum + (conv.unreadCounts?.get(id.toString()) || 0);
    }, 0);

    return response.status(200).json({
      message: "Unread count",
      result: { totalUnread },
    });
  } catch (e) {
    return response.status(500).json({ message: e.message });
  }
};
