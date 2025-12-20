import { api } from "./api";

export const createPost = (data) =>
  api("/api/posts/create", { method: "POST", body: data });

export const updatePost = (id, data) =>
  api(`/api/posts/update/${id}`, { method: "PATCH", body: data });

export const getAllPosts = (params) => api("/api/posts/all", { params });

export const searchPosts = (query) =>
  api("/api/posts/search", { params: { q: query } });

export const getTrendingPosts = () => api("/api/posts/trending");

export const toggleSavePost = (data) =>
  api("/api/posts/save", { method: "PATCH", body: data });

export const reportPost = (data) =>
  api("/api/posts/report", { method: "POST", body: data });

export const boostPost = (data) =>
  api("/api/posts/boost", { method: "PATCH", body: data });

export const followSeller = (data) =>
  api("/api/posts/follow", { method: "POST", body: data });

export const getSellerProfile = (sellerId) => api(`/api/posts/seller/profile/${sellerId}`);

export const getPostsBySeller = (sellerId, params) =>
  api(`/api/posts/seller/${sellerId}`, { params });

export const toggleLikePost = (data) =>
  api("/api/posts/like", { method: "PATCH", body: data });

export const addComment = (data) =>
  api("/api/posts/comment/add", { method: "POST", body: data });

export const deleteComment = (postId, commentId) =>
  api(`/api/posts/comment/${postId}/${commentId}`, { method: "DELETE" });

export const addReply = (data) =>
  api("/api/posts/reply/add", { method: "POST", body: data });

export const deleteReply = (postId, commentId, replyId) =>
  api(`/api/posts/reply/${postId}/${commentId}/${replyId}`, { method: "DELETE" });

export const deletePost = (id) =>
  api(`/api/posts/delete/${id}`, { method: "DELETE" });


export const searchPostsByTitlePrefix = (query, params) =>
  api("/api/posts/search-prefix", {
    params: { q: query, ...params },
  });

  export const detectCategoryFromImages = (images) =>
  api("/api/ai/detect-category", {
    method: "POST",
    body: { images },
  });