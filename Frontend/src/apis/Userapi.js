import { api } from "./api";

// AUTH
export const registerUser = (data) =>
  api("/api/users/register", { method: "POST", body: data });

export const loginUser = (data) =>
  api("/api/users/login", { method: "POST", body: data });

// USERS
export const getAllUsers = () => api("/api/users/all");

export const getUserProfile = (id) => api(`/api/users/profile/${id}`);

export const searchUsers = (query) => api(`/api/users/search/${query}`);

export const updateUser = (id, data) =>
  api(`/api/users/update/${id}`, { method: "PATCH", body: data });

export const deleteUser = (id, password) =>
  api(`/api/users/delete/${id}`, { method: "POST", body: { password } });

// CART
export const addToCart = (data) =>
  api("/api/users/cart/add", { method: "PATCH", body: data });

export const removeFromCart = (data) =>
  api("/api/users/cart/remove", { method: "PATCH", body: data });

// CART
export const getCart = () =>
  api("/api/users/cart");