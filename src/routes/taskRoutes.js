// routes/taskRoutes.js
import express from "express";
import {
  createTask,
  getTasks,
  updateTaskStatus
} from "../controllers/taskController.js";
import auth from "../middlewares/auth.js";

const router = express.Router();

// All task routes require authentication
router.use(auth);

// Create a new task (Company or Employee)
router.post("/create-task", auth, createTask);

// Get all tasks (Employee: own tasks, Company: all assigned by company)
router.get("/get-all-task", auth, getTasks);

// Update task (status, description, etc.)
router.patch("/update-task/:id", updateTaskStatus);

export default router;
