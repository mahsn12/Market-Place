import { api } from "./api";

export const createPost = (data) =>
  api("/api/posts/create", { method: "POST", body: data });

export const getAllPosts = () =>
  api("/api/posts/all");

export const searchPosts = (query) =>
  api("/api/posts/search", { params: { query } });

export const getTrendingPosts = () =>
  api("/api/posts/trending");

export const toggleSavePost = (data) =>
  api("/api/posts/save", { method: "PATCH", body: data });

export const reportPost = (data) =>
  api("/api/posts/report", { method: "POST", body: data });

export const boostPost = (data) =>
  api("/api/posts/boost", { method: "PATCH", body: data });

export const followSeller = (data) =>
  api("/api/posts/follow", { method: "POST", body: data });

export const getSellerProfile = (id) =>
  api(`/api/posts/seller/profile/${id}`);

export const toggleLikePost = (data) =>
  api("/api/posts/like", { method: "PATCH", body: data });

export const addComment = (data) =>
  api("/api/posts/comment/add", { method: "POST", body: data });

export const deleteComment = (postId, commentId) =>
  api(`/api/posts/comment/${postId}/${commentId}`, { method: "DELETE" });

export const deletePost = (id) =>
  api(`/api/posts/delete/${id}`, { method: "DELETE" });
