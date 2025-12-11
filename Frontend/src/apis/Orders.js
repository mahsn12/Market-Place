import { api } from "./api";

export const createOrder = (data) =>
  api("/api/orders/create", { method: "POST", body: data });

export const getAllOrders = () => api("/api/orders/all");

export const getOrderById = (id) => api(`/api/orders/id/${id}`);

export const updateOrder = (id, data) =>
  api(`/api/orders/update/${id}`, { method: "PUT", body: data });

export const updateOrderStatus = (id, data) =>
  api(`/api/orders/status/${id}`, { method: "PATCH", body: data });

export const deleteOrder = (id) =>
  api(`/api/orders/cancel/${id}`, { method: "DELETE" });

export const getOrdersByBuyer = (buyerId) =>
  api(`/api/orders/buyer/${buyerId}`);

export const getOrdersBySeller = (sellerId) =>
  api(`/api/orders/seller/${sellerId}`);

export const getSalesSummary = () => api("/api/orders/seller/analytics");
