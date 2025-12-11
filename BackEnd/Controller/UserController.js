import User from "../Model/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import Product from "../Model/Product.js";
import Order from "../Model/Order.js";
import Post from "../Model/Post.js";

dotenv.config();

export const registerUser = async (request, response) => {
  try {
    const { name, email, password, phone } = request.body;

    if (!name || !email || !password) {
      return response.status(400).json({ message: "Missing required fields" });
    }

    const existUser = await User.findOne({ email });
    if (existUser) {
      return response.status(400).json({ message: "Email already exists" });
    }

    const hashedPass = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashedPass,
      phone,
    });

    await user.save();

    return response.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (e) {
    return response.status(500).json({
      message: e.message,
    });
  }
};

export const getAllUsers = async (request, response) => {
  try {
    // Never return passwords or sensitive fields
    const users = await User.find().select("-password -notificationTokens");

    return response.status(200).json({
      message: "All Users retrieved",
      result: users,
    });
  } catch (e) {
    return response.status(500).json({
      message: e.message,
    });
  }
};

export const GetUser = async (request, response) => {
  try {
    const { id } = request.params;

    // Remove password
    const user = await User.findById(id).select("-password");

    if (!user) {
      return response.status(404).json({
        message: "User Not Found",
      });
    }

    return response.status(200).json({
      message: "User found",
      result: user,
    });
  } catch (e) {
    return response.status(500).json({
      message: e.message,
    });
  }
};

export const UpdateUser = async (request, response) => {
  try {
    const id = request.params.id || request.body.id;
    const updates = request.body;

    if (!id) {
      return response.status(400).json({ message: "User ID is required" });
    }

    // If updating password → rehash
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    const updatedUser = await User.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!updatedUser) {
      return response.status(404).json({
        message: "User Not Found",
      });
    }

    return response.status(200).json({
      message: "User Updated",
      result: updatedUser,
    });
  } catch (e) {
    return response.status(500).json({
      message: e.message,
    });
  }
};

export const DeleteUser = async (request, response) => {
  try {
    console.log("Delete user request:", {
      params: request.params,
      body: request.body,
      user: request.user,
    });

    const { id } = request.params;
    const { password } = request.body;

    // Verify the user is deleting their own account
    if (request.user.id !== id) {
      console.log("User ID mismatch:", {
        requestUserId: request.user.id,
        paramId: id,
      });
      return response.status(403).json({
        message: "You can only delete your own account",
      });
    }

    // Verify password
    if (!password) {
      return response.status(400).json({
        message: "Password is required to delete account",
      });
    }

    // Find the user first
    const user = await User.findById(id);
    if (!user) {
      return response.status(404).json({
        message: "User Not Found",
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return response.status(401).json({
        message: "Invalid password",
      });
    }

    // Delete all products by this user
    await Product.deleteMany({ sellerId: id });

    // Delete all posts by this user
    await Post.deleteMany({ sellerId: id });

    // Delete all orders where this user is the buyer
    await Order.deleteMany({ buyerId: id });

    // Delete all orders where this user is the seller
    await Order.deleteMany({ sellerId: id });

    // Delete the user account
    await User.findByIdAndDelete(id);

    return response.status(200).json({
      message: "Account and all associated data deleted successfully",
    });
  } catch (e) {
    return response.status(500).json({
      message: e.message,
    });
  }
};

export const searchByNameOrEmail = async (req, res) => {
  try {
    const query = req.params.query;

    const searchField = query.includes("@") ? "email" : "name";

    // Only return light info, not full object
    const users = await User.find(
      { [searchField]: { $regex: query, $options: "i" } },
      { _id: 1, name: 1, email: 1, profileImage: 1 }
    );

    // Do NOT send 404 for search results
    return res.status(200).json(users);
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const userFound = await User.findOne({ email });

    if (!userFound) {
      return res.status(404).json({
        message: "User not Found",
      });
    }

    const valid = await bcrypt.compare(password, userFound.password);

    if (!valid) {
      return res.status(401).json({
        message: "Wrong Password",
      });
    }

    const token = jwt.sign(
      { id: userFound._id, email: userFound.email },
      process.env.JWT_secret_key,
      { expiresIn: "1d" }
    );

    return res.status(200).json({
      message: "Login Successful",
      token,
      user: {
        id: userFound._id,
        name: userFound.name,
        email: userFound.email,
        profileImage: userFound.profileImage,
        phone: userFound.phone,
        verified: userFound.verified,
        rating: userFound.rating,
        ratingCount: userFound.ratingCount,
        cart: userFound.cart,
        savedProducts: userFound.savedProducts,
        lastActive: userFound.lastActive,
      },
    });
  } catch (e) {
    return res.status(500).json({
      message: e.message,
    });
  }
};

export const addToCart = async (req, res) => {
  try {
    const { productId } = req.body;
    const { userId } = req.params;

    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const product = await Product.findById(productId);
    const user = await User.findById(userId);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.cart.includes(productId)) {
      return res.status(400).json({ message: "Product already in cart" });
    }

    user.cart.push(productId);
    await user.save();

    return res.status(200).json({
      message: "Product added to cart",
      cart: user.cart,
    });
  } catch (e) {
    return res.status(500).json({
      message: e.message,
    });
  }
};

export const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.body;
    const { userId } = req.params;

    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (!user.cart.includes(productId)) {
      return res.status(400).json({ message: "Product not in cart" });
    }
    user.cart.pull(productId);
    await user.save();

    return res.status(200).json({
      message: "Product removed from cart",
      cart: user.cart,
    });
  } catch (e) {
    return res.status(500).json({
      message: e.message,
    });
  }
};
