import express from "express";
import {
  createTask,
  updateTask,
  deleteTask,
  getTaskHistory,
  getDeletedTasks,
  taskDetails,
  changeStatus,
  getActiveTasks
} from "../controllers/taskController.js";
import { auth } from "../middlewares/auth.js";

const taskRouter = express.Router();

//  Create a new task
taskRouter.post("/create", auth, createTask);

//  Task Details
taskRouter.get("/details", auth, taskDetails);

//  Update an existing task
taskRouter.put("/update", auth, updateTask);

//  Soft delete a task (Moves to deleted history)
taskRouter.delete("/delete", auth, deleteTask);

//  Retrieve all tasks for the user
taskRouter.get("/active", auth, getActiveTasks);

//  Retrieve task history (Completed & Expired tasks)
taskRouter.get("/history", auth, getTaskHistory);

//  Retrieve deleted tasks (Soft deleted)
taskRouter.get("/deleted-tasks", auth, getDeletedTasks);

//  Mark a task as completed (Moves to history)
taskRouter.put("/change-status", auth, changeStatus);

export default taskRouter;
