import { request, response } from "express";
import mongoose from "mongoose";
import Order from "../Model/Order.js";
import User from "../Model/User.js";
import Product from "../Model/Product.js";

// --- Helpers ---
async function calculateTotalPrice(products) {
  let total = 0;
  for (const item of products) {
    if (item.price != null) {
      total += item.price * item.quantity;
    } else {
      const prod = await Product.findById(item.productId).select("price");
      if (!prod) throw new Error(`Product not found: ${item.productId}`);
      total += prod.price * item.quantity;
    }
  }
  return total;
}

async function validateAndReserveStock(session, products) {
  for (const item of products) {
    const prod = await Product.findById(item.productId).session(session).select("stock status sellerId");
    if (!prod) throw new Error(`Product not found: ${item.productId}`);
    if (prod.status === "sold") throw new Error(`Product already sold: ${item.productId}`);
    if (typeof prod.stock === "number") {
      if (prod.stock < item.quantity) throw new Error(`Insufficient stock for product ${item.productId}`);
      prod.stock -= item.quantity;
      if (prod.stock === 0) prod.status = "sold";
      await prod.save({ session });
    }
  }
}

// Create Order (transactional) — reserves inventory and writes timeline
export const createOrder = async (request, response) => { 
  // TLDR: Creates an order transactionally, reserves stock, logs initial timeline, and prepares for payment.
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { buyerId, sellerId, products } = request.body;

    if (!buyerId || !sellerId || !products || !Array.isArray(products) || products.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return response.status(400).json({ message: "buyerId, sellerId and products[] are required" });
    }

    const buyer = await User.findById(buyerId).session(session);
    if (!buyer) throw new Error("Buyer not found");

    const seller = await User.findById(sellerId).session(session);
    if (!seller) throw new Error("Seller not found");

    const totalPrice = await calculateTotalPrice(products);

    await validateAndReserveStock(session, products);

    const order = new Order({
      buyerId,
      sellerId,
      products,
      totalPrice,
      status: "Pending",
      paid: false,
      refunded: false,
      paymentInfo: {},
      timeline: [{ status: "Pending", date: new Date(), by: buyerId }]
    });

    await order.save({ session });

    await session.commitTransaction();
    session.endSession();

    // TODO: Integrate payment (e.g., create a Stripe Checkout session). Return payment instructions to client.
    const payment = { provider: "stripe", clientSecret: null, checkoutUrl: null };

    // Optionally fire notification to seller
    // notifySellerOrderCreated(sellerId, order);

    return response.status(201).json({ message: "Order created successfully", orderId: order._id, payment, result: order });
  } catch (e) {
    await session.abortTransaction();
    session.endSession();
    return response.status(500).json({ message: e.message });
  }
};

// List orders with pagination and filters
export const getAllOrders = async (request, response) => {
  // TLDR: Returns paginated and filtered list of orders with buyer/seller/product info.
  try {
    const filter = {};
    const { buyerId, sellerId, status, page = 1, limit = 20 } = request.query;
    if (buyerId) filter.buyerId = buyerId;
    if (sellerId) filter.sellerId = sellerId;
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const orders = await Order.find(filter)
      .sort({ orderDate: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate("buyerId", "name email")
      .populate("sellerId", "name email")
      .populate("products.productId", "name price");

    const total = await Order.countDocuments(filter);

    return response.status(200).json({ message: "Orders retrieved", page: Number(page), limit: Number(limit), total, result: orders });
  } catch (e) {
    return response.status(500).json({ message: e.message });
  }
};

export const getOrderById = async (request, response) => {
  // TLDR: Fetches a single order with buyer, seller, and product details.
  try {
    const { id } = request.params;
    const order = await Order.findById(id)
      .populate("buyerId", "name email")
      .populate("sellerId", "name email")
      .populate("products.productId", "name price stock");

    if (!order) return response.status(404).json({ message: "Order not found" });

    return response.status(200).json({ message: "Order found", result: order });
  } catch (e) {
    return response.status(500).json({ message: e.message });
  }
};

// Update order (allowed for pending orders for address/payment updates)
export const updateOrder = async (request, response) => {
  // TLDR: Updates order info (price recalculated if products changed).
  try {
    const { id } = request.params;
    const updates = request.body;

    if (updates.products) {
      updates.totalPrice = await calculateTotalPrice(updates.products);
    }

    const updated = await Order.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    if (!updated) return response.status(404).json({ message: "Order not found" });

    return response.status(200).json({ message: "Order updated", result: updated });
  } catch (e) {
    return response.status(500).json({ message: e.message });
  }
};

// Update status (handles stock restoration on cancel, product marking on delivered)
export const updateOrderStatus = async (request, response) => {
  // TLDR: Changes order status, manages stock restoration or marking sold, logs timeline.
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = request.params;
    const { status, actorId } = request.body;

    if (!status) {
      await session.abortTransaction();
      session.endSession();
      return response.status(400).json({ message: "status is required" });
    }

    const allowed = ["Pending", "Shipped", "Delivered", "Cancelled"];
    if (!allowed.includes(status)) {
      await session.abortTransaction();
      session.endSession();
      return response.status(400).json({ message: "Invalid status value" });
    }

    const order = await Order.findById(id).session(session);
    if (!order) throw new Error("Order not found");

    // Naive permission checks — replace with real auth in production
    if (status === "Shipped") {
      if (!actorId || actorId.toString() !== order.sellerId.toString()) throw new Error("Only seller can mark as Shipped");
    }

    if (status === "Cancelled") {
      // restore stock
      for (const item of order.products) {
        const prod = await Product.findById(item.productId).session(session);
        if (prod && typeof prod.stock === "number") {
          prod.stock += item.quantity;
          if (prod.stock > 0) prod.status = "available";
          await prod.save({ session });
        }
      }
    }

    if (status === "Delivered") {
      for (const item of order.products) {
        const prod = await Product.findById(item.productId).session(session);
        if (prod) {
          prod.status = "sold";
          await prod.save({ session });
        }
      }
    }

    order.status = status;
    order.timeline = order.timeline || [];
    order.timeline.push({ status, date: new Date(), by: actorId || null });
    await order.save({ session });

    await session.commitTransaction();
    session.endSession();

    // emitOrderEvent(order, status);

    return response.status(200).json({ message: "Order status updated", result: order });
  } catch (e) {
    await session.abortTransaction();
    session.endSession();
    return response.status(500).json({ message: e.message });
  }
};

// Cancel (soft delete) — marks Cancelled and restores stock
export const deleteOrder = async (request, response) => {
  // TLDR: Cancels order, restores stock, and logs cancellation in timeline.
  try {
    const { id } = request.params;
    const { actorId } = request.body;

    const order = await Order.findById(id);
    if (!order) return response.status(404).json({ message: "Order not found" });

    if (order.status === "Shipped" && (!actorId || actorId !== order.sellerId.toString())) {
      return response.status(403).json({ message: "Cannot delete an order that has been shipped" });
    }

    order.status = "Cancelled";
    order.timeline = order.timeline || [];
    order.timeline.push({ status: 'Cancelled', date: new Date(), by: actorId || null });
    await order.save();

    for (const item of order.products) {
      const prod = await Product.findById(item.productId);
      if (prod && typeof prod.stock === "number") {
        prod.stock += item.quantity;
        if (prod.stock > 0) prod.status = "available";
        await prod.save();
      }
    }

    // enqueue refund job if needed

    return response.status(200).json({ message: "Order cancelled and stock restored", result: order });
  } catch (e) {
    return response.status(500).json({ message: e.message });
  }
};

export const getOrdersByBuyer = async (request, response) => {
  // TLDR: Returns all orders placed by a specific buyer.
  try {
    const { buyerId } = request.params;
    const orders = await Order.find({ buyerId }).populate("products.productId", "name price");
    return response.status(200).json({ message: "Orders for buyer", result: orders });
  } catch (e) {
    return response.status(500).json({ message: e.message });
  }
};

export const getOrdersBySeller = async (request, response) => {
  // TLDR: Returns all orders that belong to a seller.
  try {
    const { sellerId } = request.params;
    const orders = await Order.find({ sellerId }).populate("products.productId", "name price");
    return response.status(200).json({ message: "Orders for seller", result: orders });
  } catch (e) {
    return response.status(500).json({ message: e.message });
  }
};

// Webhook from payment provider to update payment status (simplified)
export const paymentWebhook = async (request, response) => {
  // TLDR: Handles payment provider callbacks and updates order payment status.
  try {
    const event = request.body; // verify signature in production

    if (event.type === 'payment_intent.succeeded') {
      const orderId = event.data?.object?.metadata?.orderId;
      if (orderId) {
        const order = await Order.findById(orderId);
        if (order) {
          order.paid = true;
          order.paymentInfo = order.paymentInfo || {};
          order.paymentInfo.provider = 'stripe';
          order.paymentInfo.providerId = event.data.object.id;
          order.paymentInfo.status = 'succeeded';
          order.timeline = order.timeline || [];
          order.timeline.push({ status: 'Paid', date: new Date(), by: null });
          await order.save();
          // notify seller/buyer
        }
      }
    }

    return response.status(200).json({ received: true });
  } catch (e) {
    return response.status(500).json({ message: e.message });
  }
};

// Sales analytics for seller
export const getSalesSummary = async (request, response) => {
  // TLDR: Returns sales analytics for a seller over a selected time range.
  try {
    const { sellerId, days = 30 } = request.query;
    if (!sellerId) return response.status(400).json({ message: 'sellerId required' });

    const since = new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000);

    const summary = await Order.aggregate([
      { $match: { sellerId: mongoose.Types.ObjectId(sellerId), orderDate: { $gte: since }, status: { $in: ['Shipped', 'Delivered'] } } },
      { $unwind: '$products' },
      { $group: { _id: null, totalOrders: { $sum: 1 }, totalRevenue: { $sum: '$totalPrice' }, totalItems: { $sum: '$products.quantity' } } }
    ]);

    return response.status(200).json({ message: 'Sales summary', result: summary[0] || { totalOrders: 0, totalRevenue: 0, totalItems: 0 } });
  } catch (e) {
    return response.status(500).json({ message: e.message });
  }
};

/*
NEW FEATURES ADDED :

1) Payment-ready fields and webhook handling
   - Fields used: paid, paymentInfo, refunded
   - `paymentWebhook` stub demonstrates how to mark orders paid when a provider (e.g., Stripe) calls your webhook.

2) Timeline (audit trail)
   - Every major event updates `timeline` with {status, date, by} to allow client UIs to render order history.

3) Atomic order creation with stock reservation
   - Uses Mongoose transactions to reserve stock when creating an order, preventing race conditions.
   - `validateAndReserveStock` decrements product stock inside the transaction.

4) Stock restoration on cancel / failure
   - When orders are cancelled (soft-delete) or explicitly cancelled via status change, product stock is restored.

5) Status transition guards (example)
   - Basic checks to ensure only sellers mark shipped. Replace with proper role-based auth middleware.

6) Soft-delete / Cancel instead of hard delete
   - Orders are marked `Cancelled` and kept for audit and analytics; stock is restored.

7) Sales analytics endpoint
   - `getSalesSummary` gives totals for revenue, orders and items over a period.

8) Pagination and filtering for listing orders
   - `getAllOrders` supports page/limit and common filters.

9) Refund and background job hooks
   - Spots in code comment where you'd enqueue refund/background jobs (Bull/Agenda) for retries and long-running tasks.

10) Notification/webhook hooks
   - Placeholders to call notification services (email/push) when important events occur (order created, paid, shipped).

SECURITY & NEXT STEPS:
- Replace naive actorId-based checks with real authentication and role/permission middleware.
- Verify webhook signatures (Stripe signatures) to avoid forged events.
- Add idempotency keys for webhook/event handling.
- Add unit and integration tests for transaction flows (successful create, failure rollback, cancel/restore).

DB CHANGES REMINDER:
- Order model must include: paid, paymentInfo, refunded, timeline (done).
- Product model should include: stock (Number), status (available|sold), optionally reservedCount for complex inventory.

*/
