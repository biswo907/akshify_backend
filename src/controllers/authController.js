// controllers/authController.js

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import "dotenv/config";
import UserModel from "../models/user.js";

const SECRET_KEY = process.env.SECRET_KEY;

// Company Signup
export const signup = async (req, res) => {
  try {
    const {
      full_name,
      username,
      phone,
      email,
      password,
      confirm_password,
      type
    } = req.body;

    // Check if user exists
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    if (password !== confirm_password) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const password_hash = await bcrypt.hash(password, 10);

    // Create new user without companyId initially
    const newUser = new UserModel({
      full_name,
      username,
      phone,
      email,
      password_hash,
      type,
      is_active: true
    });

    // Save user first
    await newUser.save();

    // If company, update companyId to own _id
    if (type === "company") {
      newUser.companyId = newUser._id;
      await newUser.save();
    }

    // Create JWT token
    const token = jwt.sign(
      { id: newUser._id, type: newUser.type },
      SECRET_KEY,
      { expiresIn: "1h" }
    );

    // Respond with user info including user_id and companyId
    res.status(201).json({
      user: {
        user_id: newUser._id,
        full_name: newUser.full_name,
        username: newUser.username,
        email: newUser.email,
        phone: newUser.phone,
        type: newUser.type,
        is_active: newUser.is_active,
        companyId: newUser.companyId
      },
      token
    });
  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({ message: "Server error during signup" });
  }
};

// Login for both company and employee
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Invalid email or password" });
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(403).json({ message: "User is disabled" });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Generate JWT token with id and type
    const token = jwt.sign({ id: user._id, type: user.type }, SECRET_KEY, {
      expiresIn: "1h"
    });

    // Resolve companyId
    const companyId = user.type === "company" ? user._id : user.companyId;

    res.status(200).json({
      user: {
        user_id: user._id,
        full_name: user.full_name,
        username: user.username,
        email: user.email,
        phone: user.phone,
        type: user.type,
        is_active: user.is_active,
        companyId: companyId
      },
      token
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
};
