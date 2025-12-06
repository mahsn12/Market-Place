import { api } from "./api";

// AUTH
export const registerUser = (data) =>
  api("/api/users/register", { method: "POST", body: data });

export const loginUser = (data) =>
  api("/api/users/login", { method: "POST", body: data });

// USERS
export const getAllUsers = () =>
  api("/api/users/all");

export const getUserProfile = (id) =>
  api(`/api/users/profile/${id}`);

export const searchUsers = (query) =>
  api(`/api/users/search/${query}`);

export const updateUser = (data) =>
  api("/api/users/update", { method: "PATCH", body: data });

export const deleteUser = (id) =>
  api(`/api/users/delete/${id}`, { method: "DELETE" });

// CART
export const addToCart = (data) =>
  api("/api/users/cart/add", { method: "PATCH", body: data });

export const removeFromCart = (data) =>
  api("/api/users/cart/remove", { method: "PATCH", body: data });
