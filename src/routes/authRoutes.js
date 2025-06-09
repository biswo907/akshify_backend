// routes/authRoutes.js
import express from "express";
import { signup, login } from "../controllers/authController.js";

const router = express.Router();

// Company Signup
router.post("/signup", signup);

// Login for both company and employee
router.post("/login", login);

export default router;
