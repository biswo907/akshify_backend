// controllers/userController.js

import UserModel from "../models/user.js";
import bcrypt from "bcryptjs";

// Create Employee (Company only)
export const createEmployee = async (req, res) => {
  try {
    const companyId = req.user.id; // from auth middleware
    const companyType = req.user.type;

    if (companyType !== "company") {
      return res
        .status(403)
        .json({ message: "Only company users can create employees" });
    }

    const {
      full_name,
      username,
      phone,
      email,
      password,
      confirm_password
    } = req.body;

    // Password match validation
    if (password !== confirm_password) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    // Check if employee already exists
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Create new employee
    const newEmployee = new UserModel({
      full_name,
      username,
      phone,
      email,
      password_hash,
      type: "employee",
      companyId,
      is_active: true
    });

    await newEmployee.save();

    // Custom formatted user response
    const responseUser = {
      user_id: newEmployee._id,
      full_name: newEmployee.full_name,
      username: newEmployee.username,
      email: newEmployee.email,
      phone: newEmployee.phone,
      type: newEmployee.type,
      is_active: newEmployee.is_active,
      companyId: newEmployee.companyId
    };

    res.status(201).json({
      message: "Employee created successfully",
      user: responseUser
    });
  } catch (error) {
    console.error("Create Employee Error:", error);
    res.status(500).json({ message: "Server error creating employee" });
  }
};

// Edit Employee (Company only)
export const editEmployee = async (req, res) => {
  try {
    const companyId = req.user.id;
    const companyType = req.user.type;

    if (companyType !== "company") {
      return res
        .status(403)
        .json({ message: "Only company users can edit employees" });
    }

    const {
      employeeId,
      full_name,
      username,
      phone,
      email,
      password,
      confirm_password
    } = req.body;

    if (!employeeId) {
      return res.status(400).json({ message: "employeeId is required" });
    }

    const employee = await UserModel.findOne({
      _id: employeeId,
      type: "employee",
      companyId
    });

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Optional: Check email uniqueness
    if (email && email !== employee.email) {
      const emailExists = await UserModel.findOne({
        email,
        _id: { $ne: employeeId }
      });
      if (emailExists) {
        return res.status(400).json({ message: "Email already registered" });
      }
      employee.email = email;
    }

    if (full_name) employee.full_name = full_name;
    if (username) employee.username = username;
    if (phone) employee.phone = phone;

    if (password || confirm_password) {
      if (password !== confirm_password) {
        return res.status(400).json({ message: "Passwords do not match" });
      }
      employee.password_hash = await bcrypt.hash(password, 10);
    }

    await employee.save();

    res.status(200).json({
      message: "Employee updated successfully",
      status: 200
    });
  } catch (error) {
    console.error("Edit Employee Error:", error);
    res.status(500).json({ message: "Server error editing employee" });
  }
};

// Update User Profile (both company and employee can update their own)
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const updateData = req.body;

    // Prevent changing type, companyId, is_active here
    delete updateData.type;
    delete updateData.companyId;
    delete updateData.is_active;
    delete updateData.password_hash;

    // If password is being updated, hash it
    if (updateData.password) {
      if (updateData.password !== updateData.confirm_password) {
        return res.status(400).json({ message: "Passwords do not match" });
      }
      updateData.password_hash = await bcrypt.hash(updateData.password, 10);
      delete updateData.password;
      delete updateData.confirm_password;
    }

    const updatedUser = await UserModel.findByIdAndUpdate(userId, updateData, {
      new: true
    }).select("-password_hash");

    res
      .status(200)
      .json({ message: "Profile updated successfully", user: updatedUser });
  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({ message: "Server error updating profile" });
  }
};

// Disable Employee (soft delete) - only company can disable their employees
export const toggleEmployeeStatus = async (req, res) => {
  try {
    const companyId = req.user.id;
    const companyType = req.user.type;

    if (companyType !== "company") {
      return res
        .status(403)
        .json({ message: "Only company users can update employee status" });
    }

    const { userId, is_active } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    if (typeof is_active !== "boolean") {
      return res.status(400).json({ message: "is_active must be a boolean" });
    }

    const employee = await UserModel.findOne({
      _id: userId,
      companyId,
      type: "employee"
    });

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found or does not belong to your company"
      });
    }

    employee.is_active = is_active;
    await employee.save();

    const status = is_active ? "enabled" : "disabled";
    res.status(200).json({ message: `Employee ${status} successfully` });
  } catch (error) {
    console.error("Toggle Employee Status Error:", error);
    res.status(500).json({ message: "Server error updating employee status" });
  }
};

// Get list of employees for the logged-in company
export const listEmployees = async (req, res) => {
  try {
    const companyId = req.user.id;
    const companyType = req.user.type;

    if (companyType !== "company") {
      return res
        .status(403)
        .json({ message: "Only company users can view employees" });
    }

    const employees = await UserModel.find({
      companyId,
      type: "employee"
    }).select("-password_hash");

    res.status(200).json({ employees });
  } catch (error) {
    console.error("List Employees Error:", error);
    res.status(500).json({ message: "Server error fetching employees" });
  }
};

// Get logged in user profile
export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await UserModel.findById(userId).select("-password_hash");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ user });
  } catch (error) {
    console.error("Get Profile Error:", error);
    res.status(500).json({ message: "Server error fetching profile" });
  }
};
