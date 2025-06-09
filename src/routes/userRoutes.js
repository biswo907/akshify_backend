// routes/userRoutes.js
import express from "express";
import {
  createEmployee,
  disableEmployee,
  listEmployees
} from "../controllers/userController.js";
import auth from "../middlewares/auth.js";

const router = express.Router();

// All user routes require authentication
router.use(auth);

// Create employee (Company only)
router.post("/create-employee", auth, createEmployee);
router.get("/list-employees", auth, listEmployees);

// Get all employees under the logged-in company
// router.get("/", getAllEmployees);

// Get a specific employee by ID
// router.get("/:id", getEmployeeById);

// Update employee profile (Company or Employee)
// router.patch("/:id", updateEmployeeProfile);

// Soft-delete (disable) an employee (Company only)
router.patch("/disable/:id", disableEmployee);

export default router;
