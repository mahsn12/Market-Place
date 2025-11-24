import User from "../Model/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export const registerUser = async (request, response) => {
  try {
    const { name, email, password, role, phone } = request.body;

    const existUser = await User.findOne({ email });

    if (existUser) {
      return response.status(400).json({
        message: "User Name Exists"
      });
    }

    const hashedPass = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashedPass,
      role,
      phone
    });

    await user.save();

    return response.status(201).json({
      message: "User registered successfully",
      name: user.name
    });
  } catch (e) {
    return response.status(500).json({
      message: e.message
    });
  }
};

export const getAllUsers = async (request, response) => {
  try {
    const users = await User.find();
    return response.status(200).json({
      message: "All Users were retrived",
      result: users
    });
  } catch (e) {
    return response.status(500).json({
      message: e.message
    });
  }
};

export const GetUser = async (request, response) => {
  try {
    const { id } = request.params;

    const user = await User.findById(id);
    if (!user) {
      return response.status(404).json({
        message: "User Not Found"
      });
    }

    return response.status(200).json({
      message: "User found",
      result: user
    });
  } catch (e) {
    return response.status(500).json({
      message: e.message
    });
  }
};

export const UpdateUser = async (request, response) => {
  try {
    const { id } = request.params;
    const updates = request.body;

    const updatedUser = await User.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true
    });

    if (!updatedUser) {
      return response.status(404).json({
        message: "Not Found"
      });
    }

    return response.status(200).json({
      message: "User Updated"
    });
  } catch (e) {
    return response.status(500).json({
      message: e.message
    });
  }
};

export const DeleteUser = async (request, response) => {
  try {
    const { id } = request.params;

    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return response.status(404).json({
        message: "User Not Found"
      });
    }

    return response.status(200).json({
      message: "User Deleted Successfully"
    });
  } catch (e) {
    return response.status(500).json({
      message: e.message
    });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // NOTE: always query using an object {email}
    const userFound = await User.findOne({ email });

    if (!userFound) {
      return res.status(404).json({
        message: "User not Found"
      });
    }

    // compare(plain, hashed)
    const valid = await bcrypt.compare(password, userFound.password);

    if (!valid) {
      return res.status(401).json({
        message: "Wrong Password"
      });
    }

    const token = jwt.sign(
      {
        id: userFound._id,
        email: userFound.email
      },
      process.env.JWT_secret_key,
      { expiresIn: "1d" }
    );

    return res.status(200).json({
      message: "Login Successful",
      token
    });
  } catch (e) {
    return res.status(500).json({
      message: e.message
    });
  }
};
