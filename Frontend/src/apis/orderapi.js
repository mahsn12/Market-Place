import { api } from "./api";

/* =========================
   ORDERS
========================= */

// Create order directly (single seller / direct checkout)
export const createOrder = (data) =>
  api("/api/orders/create", {
    method: "POST",
    body: data,
  });

// Convert cart → orders (grouped by seller)
export const convertCartToOrders = (shippingAddress) =>
  api("/api/orders/cart/convert", {
    method: "POST",
    body: { shippingAddress },
  });

// Get all orders (admin / debug)
export const getAllOrders = (params) =>
  api("/api/orders/all", { params });

// Get single order by ID
export const getOrderById = (id) =>
  api(`/api/orders/id/${id}`);

// Update order (address / metadata)
export const updateOrder = (id, data) =>
  api(`/api/orders/update/${id}`, {
    method: "PUT",
    body: data,
  });

// Update order status (seller actions)
export const updateOrderStatus = (id, data) =>
  api(`/api/orders/status/${id}`, {
    method: "PATCH",
    body: data,
  });

// Cancel order
export const cancelOrder = (id, actorId) =>
  api(`/api/orders/cancel/${id}`, {
    method: "DELETE",
    body: { actorId },
  });

// Orders by buyer
export const getOrdersByBuyer = (buyerId) =>
  api(`/api/orders/buyer/${buyerId}`);

// Orders by seller
export const getOrdersBySeller = (sellerId) =>
  api(`/api/orders/seller/${sellerId}`);

// Seller analytics
export const getSalesSummary = (sellerId, days = 30) =>
  api("/api/orders/seller/analytics", {
    params: { sellerId, days },
  });
