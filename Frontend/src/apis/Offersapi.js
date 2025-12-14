import axios from "axios";

const API_URL = "http://localhost:5200/api/offers";

const getToken = () => localStorage.getItem("token");

const config = () => ({
  headers: {
    Authorization: `Bearer ${getToken()}`,
  },
});

// Create offer
export const createOffer = async (postId, offerAmount, message) => {
  try {
    const response = await axios.post(
      `${API_URL}/create`,
      { postId, offerAmount, message },
      config()
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.message };
  }
};

// Get offers for a post
export const getOffersForPost = async (postId) => {
  try {
    const response = await axios.get(`${API_URL}/post/${postId}`, config());
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.message };
  }
};

// Get buyer's offers
export const getBuyerOffers = async (page = 1, limit = 10) => {
  try {
    const response = await axios.get(
      `${API_URL}/buyer?page=${page}&limit=${limit}`,
      config()
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.message };
  }
};

// Get seller's offers
export const getSellerOffers = async (page = 1, limit = 10) => {
  try {
    const response = await axios.get(
      `${API_URL}/seller?page=${page}&limit=${limit}`,
      config()
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.message };
  }
};

// Accept offer (seller)
export const acceptOffer = async (offerId) => {
  try {
    const response = await axios.post(
      `${API_URL}/accept/${offerId}`,
      {},
      config()
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.message };
  }
};

// Reject offer (seller)
export const rejectOffer = async (offerId, message) => {
  try {
    const response = await axios.post(
      `${API_URL}/reject/${offerId}`,
      { message },
      config()
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.message };
  }
};

// Counter offer (seller)
export const counterOffer = async (offerId, counterAmount, message) => {
  try {
    const response = await axios.post(
      `${API_URL}/counter/${offerId}`,
      { counterAmount, message },
      config()
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.message };
  }
};

// Accept counter offer (buyer)
export const acceptCounterOffer = async (offerId) => {
  try {
    const response = await axios.post(
      `${API_URL}/accept-counter/${offerId}`,
      {},
      config()
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.message };
  }
};

// Withdraw offer (buyer)
export const withdrawOffer = async (offerId) => {
  try {
    const response = await axios.post(
      `${API_URL}/withdraw/${offerId}`,
      {},
      config()
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.message };
  }
};

// Get offer statistics
export const getOfferStats = async () => {
  try {
    const response = await axios.get(`${API_URL}/stats`, config());
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: error.message };
  }
};
