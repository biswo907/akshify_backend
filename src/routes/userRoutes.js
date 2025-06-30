// routes/userRoutes.js
import express from "express";
import {
  createEmployee,
  getProfile,
  listEmployees,
  toggleEmployeeStatus,
  updateProfile
} from "../controllers/userController.js";
import auth from "../middlewares/auth.js";

const router = express.Router();

// 🔐 All user routes require authentication
router.use(auth);

// 👤 Get own profile
router.get("/profile", getProfile);

// 🔁 Update own profile
router.patch("/update-profile", updateProfile);

// 👥 Create employee (Company only)
router.post("/create-employee", createEmployee);

// 📃 List all employees under this company
router.get("/list-employees", listEmployees);

// 🔄 Enable/Disable (toggle) employee status
router.patch("/toggle-status", toggleEmployeeStatus);
export default router;
