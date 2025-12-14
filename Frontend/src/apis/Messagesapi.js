import axios from "axios";

const API_URL = "http://localhost:5200/api/messages";

const getToken = () => localStorage.getItem("token");

const config = () => ({
  headers: {
    Authorization: `Bearer ${getToken()}`,
  },
});

// Get all conversations
export const getConversations = async () => {
  try {
    const response = await axios.get(`${API_URL}/conversations`, config());
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.message };
  }
};

// Get messages in conversation
export const getMessages = async (conversationId, page = 1, limit = 30) => {
  try {
    const response = await axios.get(
      `${API_URL}/messages/${conversationId}?page=${page}&limit=${limit}`,
      config()
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.message };
  }
};

// Send message
export const sendMessage = async (receiverId, content, conversationId = null, postId = null) => {
  try {
    const response = await axios.post(
      `${API_URL}/send`,
      {
        receiverId,
        content,
        conversationId,
        postId,
      },
      config()
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.message };
  }
};

// Delete message
export const deleteMessage = async (messageId) => {
  try {
    const response = await axios.delete(
      `${API_URL}/messages/${messageId}`,
      config()
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.message };
  }
};

// Start conversation from post
export const startConversation = async (sellerId, postId) => {
  try {
    const response = await axios.post(
      `${API_URL}/start-conversation`,
      { sellerId, postId },
      config()
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.message };
  }
};

// Block user
export const blockUser = async (conversationId, blockUserId) => {
  try {
    const response = await axios.post(
      `${API_URL}/block`,
      { conversationId, blockUserId },
      config()
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.message };
  }
};

// Unblock user
export const unblockUser = async (conversationId) => {
  try {
    const response = await axios.post(
      `${API_URL}/unblock`,
      { conversationId },
      config()
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.message };
  }
};

// Get unread count
export const getUnreadCount = async () => {
  try {
    const response = await axios.get(`${API_URL}/unread-count`, config());
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.message };
  }
};
