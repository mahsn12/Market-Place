import { api } from "./api";

export const createProduct = (data) =>
  api("/api/products/create", { method: "POST", body: data });

export const getAllProducts = (params) => api("/api/products/all", { params });

export const getProduct = (id) => api(`/api/products/single/${id}`);

export const updateProduct = (data) =>
  api("/api/products/update", { method: "PATCH", body: data });

export const deleteProduct = (id) =>
  api(`/api/products/delete/${id}`, { method: "DELETE" });

export const getProductsBySeller = (sellerId) =>
  api(`/api/products/seller/${sellerId}`);
