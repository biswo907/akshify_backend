import express from "express";
import {
  createTask,
  updateTask,
  deleteTask,
  getAllTasks,
  getFavoriteTasks,
  getTaskHistory,
  getDeletedTasks,
  completeTask
} from "../controllers/taskController.js";
import { auth } from "../middlewares/auth.js";

const taskRouter = express.Router();

// 🟢 Create a new task
taskRouter.post("/create", auth, createTask);

// 🟢 Update an existing task
taskRouter.put("/update/:id", auth, updateTask);

// 🚀 Soft delete a task (Moves to deleted history)
taskRouter.delete("/delete/:id", auth, deleteTask);

// 🟢 Retrieve all tasks for the user
taskRouter.get("/all", auth, getAllTasks);

// ⭐ Get favorite tasks
taskRouter.get("/favorite", auth, getFavoriteTasks);

// 🟢 Retrieve task history (Completed & Expired tasks)
taskRouter.get("/history", auth, getTaskHistory);

// 🗑️ Retrieve deleted tasks (Soft deleted)
taskRouter.get("/deleted-tasks", auth, getDeletedTasks);

// ✅ Mark a task as completed (Moves to history)
taskRouter.put("/complete/:id", auth, completeTask);

export default taskRouter;
