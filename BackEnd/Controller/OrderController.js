import { request, response } from "express";
import mongoose from "mongoose";
import Order from "../Model/Order.js";
import User from "../Model/User.js";
import Post from "../Model/Post.js";

// --- Helpers ---
async function calculateTotalPrice(items) {
  let total = 0;
  for (const item of items) {
    if (item.price != null) {
      total += item.price * item.quantity;
    } else {
      const post = await Post.findById(item.postId).select("price");
      if (!post) throw new Error(`Post not found: ${item.postId}`);
      total += post.price * item.quantity;
    }
  }
  return total;
}

async function validateAndReserveItems(items, sellerId, session) {
  for (const item of items) {
    const post = await Post.findById(item.postId)
      .select("quantity sellerId price")
      .session(session);
    
    if (!post) throw new Error(`Post not found: ${item.postId}`);
    
    // Validate post belongs to the seller
    if (post.sellerId.toString() !== sellerId.toString()) {
      throw new Error(`Post ${item.postId} does not belong to seller ${sellerId}`);
    }
    
    // Check if there's enough quantity
    if (post.quantity < item.quantity) {
      throw new Error(`Insufficient quantity for post ${item.postId}. Available: ${post.quantity}, Requested: ${item.quantity}`);
    }
    
    // Decrement the quantity
    post.quantity -= item.quantity;
    await post.save({ session });
    
    // Store the price at time of purchase for record keeping
    if (!item.price) {
      item.price = post.price;
    }
  }
}

// Create Order (TRANSACTIONAL) — reserves quantity and creates order
export const createOrder = async (request, response) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { sellerId, items, shippingAddress } = request.body;
    const buyerId = request.user.id;

    if (
      !buyerId ||
      !sellerId ||
      !items ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      await session.abortTransaction();
      session.endSession();
      return response
        .status(400)
        .json({ message: "sellerId and items[] are required" });
    }

    // Validate shipping address (required fields from schema)
    if (!shippingAddress || 
        !shippingAddress.fullName || 
        !shippingAddress.phone || 
        !shippingAddress.street || 
        !shippingAddress.city) {
      await session.abortTransaction();
      session.endSession();
      return response.status(400).json({ 
        message: "Shipping address with fullName, phone, street, and city are required" 
      });
    }

    // Prevent self-purchase
    if (buyerId.toString() === sellerId.toString()) {
      await session.abortTransaction();
      session.endSession();
      return response.status(400).json({
        message: "You cannot buy your own post",
      });
    }

    const buyer = await User.findById(buyerId).session(session);
    if (!buyer) {
      await session.abortTransaction();
      session.endSession();
      throw new Error("Buyer not found");
    }

    const seller = await User.findById(sellerId).session(session);
    if (!seller) {
      await session.abortTransaction();
      session.endSession();
      throw new Error("Seller not found");
    }

    const totalPrice = await calculateTotalPrice(items);
    
    // Validate and reserve items IN TRANSACTION
    await validateAndReserveItems(items, sellerId, session);

    const order = new Order({
      buyerId,
      sellerId,
      shippingAddress,
      items,
      totalPrice,
      status: "Pending",
      paid: false,
      refunded: false,
      paymentInfo: {},
      timeline: [{ status: "Pending", date: new Date(), by: buyerId }],
      orderDate: new Date(),
    });

    await order.save({ session });

    await session.commitTransaction();
    session.endSession();

    // TODO: Integrate payment
    const payment = {
      provider: "stripe",
      clientSecret: null,
      checkoutUrl: null,
    };

    // Optionally fire notification to seller
    // notifySellerOrderCreated(sellerId, order);

    return response
      .status(201)
      .json({
        message: "Order created successfully",
        orderId: order._id,
        payment,
        result: order,
      });
  } catch (e) {
    await session.abortTransaction();
    session.endSession();
    return response.status(500).json({ message: e.message });
  }
};

// List orders with pagination and filters
export const getAllOrders = async (request, response) => {
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
      .populate("items.postId", "title price quantity");

    const total = await Order.countDocuments(filter);

    return response
      .status(200)
      .json({
        message: "Orders retrieved",
        page: Number(page),
        limit: Number(limit),
        total,
        result: orders,
      });
  } catch (e) {
    return response.status(500).json({ message: e.message });
  }
};

export const getOrderById = async (request, response) => {
  try {
    const { id } = request.params;
    const order = await Order.findById(id)
      .populate("buyerId", "name email")
      .populate("sellerId", "name email")
      .populate("items.postId", "title price quantity");

    if (!order)
      return response.status(404).json({ message: "Order not found" });

    return response.status(200).json({ message: "Order found", result: order });
  } catch (e) {
    return response.status(500).json({ message: e.message });
  }
};

// Update order (allowed for pending orders for address/payment updates)
export const updateOrder = async (request, response) => {
  // Note: Changing items after creation is complex - might need to restore old quantities
  // and reserve new ones. Consider making items immutable after creation.
  try {
    const { id } = request.params;
    const updates = request.body;

    // Prevent changing items after order is created (too complex with inventory)
    if (updates.items && updates.items.length > 0) {
      return response.status(400).json({ 
        message: "Cannot change items after order creation. Cancel and create new order instead." 
      });
    }

    const updated = await Order.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });
    if (!updated)
      return response.status(404).json({ message: "Order not found" });

    return response
      .status(200)
      .json({ message: "Order updated", result: updated });
  } catch (e) {
    return response.status(500).json({ message: e.message });
  }
};

// Update status (handles quantity restoration on cancel)
export const updateOrderStatus = async (request, response) => {
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

    // Permission checks
    if (status === "Shipped") {
      if (!actorId || actorId.toString() !== order.sellerId.toString())
        throw new Error("Only seller can mark as Shipped");
    }

    if (status === "Cancelled") {
      // restore quantity IN TRANSACTION
      for (const item of order.items) {
        const post = await Post.findById(item.postId).session(session);
        if (post && typeof post.quantity === "number") {
          post.quantity += item.quantity;
          await post.save({ session });
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

    return response
      .status(200)
      .json({ message: "Order status updated", result: order });
  } catch (e) {
    await session.abortTransaction();
    session.endSession();
    return response.status(500).json({ message: e.message });
  }
};

// Cancel (soft delete) — marks Cancelled and restores quantity
export const deleteOrder = async (request, response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = request.params;
    const { actorId } = request.body;

    const order = await Order.findById(id).session(session);
    if (!order) {
      await session.abortTransaction();
      session.endSession();
      return response.status(404).json({ message: "Order not found" });
    }

    if (
      order.status === "Shipped" &&
      (!actorId || actorId !== order.sellerId.toString())
    ) {
      await session.abortTransaction();
      session.endSession();
      return response
        .status(403)
        .json({ message: "Cannot delete an order that has been shipped" });
    }

    order.status = "Cancelled";
    order.timeline = order.timeline || [];
    order.timeline.push({
      status: "Cancelled",
      date: new Date(),
      by: actorId || null,
    });
    await order.save({ session });

    // Restore quantity to posts IN TRANSACTION
    for (const item of order.items) {
      const post = await Post.findById(item.postId).session(session);
      if (post && typeof post.quantity === "number") {
        post.quantity += item.quantity;
        await post.save({ session });
      }
    }

    await session.commitTransaction();
    session.endSession();

    // enqueue refund job if needed

    return response
      .status(200)
      .json({ message: "Order cancelled and quantity restored", result: order });
  } catch (e) {
    await session.abortTransaction();
    session.endSession();
    return response.status(500).json({ message: e.message });
  }
};

export const getOrdersByBuyer = async (request, response) => {
  try {
    const { buyerId } = request.params;
    const orders = await Order.find({ buyerId }).populate(
      "items.postId",
      "title price"
    );
    return response
      .status(200)
      .json({ message: "Orders for buyer", result: orders });
  } catch (e) {
    return response.status(500).json({ message: e.message });
  }
};

export const getOrdersBySeller = async (request, response) => {
  try {
    const { sellerId } = request.params;
    const orders = await Order.find({ sellerId }).populate(
      "items.postId",
      "title price"
    );
    return response
      .status(200)
      .json({ message: "Orders for seller", result: orders });
  } catch (e) {
    return response.status(500).json({ message: e.message });
  }
};

// Webhook from payment provider to update payment status (simplified)
export const paymentWebhook = async (request, response) => {
  try {
    const event = request.body;

    if (event.type === "payment_intent.succeeded") {
      const orderId = event.data?.object?.metadata?.orderId;
      if (orderId) {
        const order = await Order.findById(orderId);
        if (order) {
          order.paid = true;
          order.paymentInfo = order.paymentInfo || {};
          order.paymentInfo.provider = "stripe";
          order.paymentInfo.providerId = event.data.object.id;
          order.paymentInfo.status = "succeeded";
          order.timeline = order.timeline || [];
          order.timeline.push({ status: "Paid", date: new Date(), by: null });
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
  try {
    const { sellerId, days = 30 } = request.query;
    if (!sellerId)
      return response.status(400).json({ message: "sellerId required" });

    const since = new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000);

    const summary = await Order.aggregate([
      {
        $match: {
          sellerId: mongoose.Types.ObjectId(sellerId),
          orderDate: { $gte: since },
          status: { $in: ["Shipped", "Delivered"] },
        },
      },
      { $unwind: "$items" },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$totalPrice" },
          totalItems: { $sum: "$items.quantity" },
        },
      },
    ]);

    return response
      .status(200)
      .json({
        message: "Sales summary",
        result: summary[0] || {
          totalOrders: 0,
          totalRevenue: 0,
          totalItems: 0,
        },
      });
  } catch (e) {
    return response.status(500).json({ message: e.message });
  }
};

// ✅ REFACTORED to use existing helpers and maintain consistency
export const convertCartToOrders = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // ❗ لازم يكون جاي من authMiddleware
    const buyerId = req.user?.id;
    if (!buyerId) {
      throw new Error("Unauthorized: buyer id missing");
    }

    const { shippingAddress } = req.body;

    // ✅ Validate reminder address
    if (
      !shippingAddress ||
      !shippingAddress.fullName ||
      !shippingAddress.phone ||
      !shippingAddress.street ||
      !shippingAddress.city
    ) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        message:
          "Shipping address with fullName, phone, street, and city is required",
      });
    }

    // ✅ Load user + cart
    const user = await User.findById(buyerId)
      .populate("cart.postId", "sellerId price quantity")
      .session(session);

    if (!user || user.cart.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "Cart is empty" });
    }

    // 🔁 Group cart items by seller
    const ordersBySeller = {};

for (const cartItem of user.cart) {
  if (!cartItem.postId) {
    throw new Error("Invalid cart item (post missing)");
  }

  const sellerId = cartItem.postId.sellerId.toString();

  if (sellerId === buyerId.toString()) {
    throw new Error("You cannot buy your own post");
  }

  // ✅ FIX IS HERE
  const qty = Number(cartItem.quantity); // 🔥 NOT cartQuantity

  if (!Number.isInteger(qty) || qty <= 0) {
    throw new Error(
      `Invalid cart quantity for post ${cartItem.postId._id}`
    );
  }

  if (!ordersBySeller[sellerId]) {
    ordersBySeller[sellerId] = [];
  }

  ordersBySeller[sellerId].push({
    postId: cartItem.postId._id,
    quantity: qty,
    price: cartItem.postId.price,
  });
}


    const createdOrders = [];

    // 🧾 Create one order per seller
    for (const sellerId in ordersBySeller) {
      const items = ordersBySeller[sellerId];

      // ✅ Validate stock + MINUS quantity safely
      for (const item of items) {
        const post = await Post.findById(item.postId)
          .select("quantity sellerId price")
          .session(session);

        if (!post) {
          throw new Error("Post not found");
        }

        if (post.sellerId.toString() !== sellerId) {
          throw new Error("Post does not belong to seller");
        }

        if (post.quantity < item.quantity) {
          throw new Error(
            `Insufficient quantity. Available: ${post.quantity}, Requested: ${item.quantity}`
          );
        }

        // ✅ HERE IS THE REAL SUBTRACTION
        post.quantity = post.quantity - item.quantity;

        await post.save({ session });
      }

      // ✅ Calculate total
      const totalPrice = items.reduce(
        (sum, i) => sum + i.price * i.quantity,
        0
      );

      // ✅ Create order
      const order = new Order({
        buyerId,
        sellerId,
        shippingAddress,
        items,
        totalPrice,
        status: "Pending",
        paid: false,
        refunded: false,
        paymentInfo: {},
        timeline: [{ status: "Pending", date: new Date(), by: buyerId }],
        orderDate: new Date(),
      });

      await order.save({ session });
      createdOrders.push(order);
    }

    // 🧹 Clear cart
    user.cart = [];
    await user.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      message: "Cart converted to orders successfully",
      orders: createdOrders,
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
};
