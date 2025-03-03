import mongoose from "mongoose";
import TaskModel from "../models/task.js";

// 🟢 GET ALL TASKS
export const getAllTasks = async (req, res) => {
  try {
    const tasks = await TaskModel.find({
      userId: req.userId,
      status: { $ne: "deleted" }
    });
    return res.status(200).json(tasks);
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// 🟢 CREATE TASK
export const createTask = async (req, res) => {
  const {
    title,
    description,
    task_color,
    task_font_family,
    description_color,
    description_font_family,
    from_date,
    to_date,
    priority,
    is_favorite
  } = req.body;

  if (!title || !from_date || !to_date) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const newTask = new TaskModel({
    title,
    description,
    task_color,
    task_font_family,
    description_color,
    description_font_family,
    from_date,
    to_date,
    priority,
    is_favorite,
    userId: req.userId,
    status: "pending"
  });

  try {
    await newTask.save();
    return res
      .status(200)
      .json({ message: "Task Created Successfully", task: newTask });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// 🟢 UPDATE TASK
export const updateTask = async (req, res) => {
  const { id } = req.params;
  const {
    title,
    description,
    task_color,
    task_font_family,
    description_color,
    description_font_family,
    status,
    is_favorite
  } = req.body;

  try {
    const updatedTask = await TaskModel.findByIdAndUpdate(
      id,
      {
        title,
        description,
        task_color,
        task_font_family,
        description_color,
        description_font_family,
        status,
        is_favorite
      },
      { new: true }
    );

    if (!updatedTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    return res
      .status(200)
      .json({ message: "Task Updated Successfully", task: updatedTask });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// 🚀 DELETE TASK (Move to Deleted History)
export const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate if the ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid Task ID format" });
    }

    const task = await Task.findByIdAndDelete(id);

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.status(200).json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Delete Task Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// 🚀 GET DELETED TASKS
export const getDeletedTasks = async (req, res) => {
  try {
    const deletedTasks = await TaskModel.find({
      userId: req.userId,
      status: "deleted"
    });
    res.status(200).json(deletedTasks);
  } catch (error) {
    console.error("Get Deleted Tasks Error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

// 🟢 GET TASK HISTORY (Completed & Expired)
export const getTaskHistory = async (req, res) => {
  try {
    const tasks = await TaskModel.find({
      userId: req.userId,
      status: { $in: ["completed", "expired"] }
    }).select("title description status to_date createdAt updatedAt");

    res.status(200).json({
      success: true,
      count: tasks.length,
      tasks
    });
  } catch (error) {
    console.error("Error fetching task history:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// 🟢 MARK TASK AS COMPLETED
export const completeTask = async (req, res) => {
  const { id } = req.params;

  try {
    const task = await TaskModel.findById(id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    task.status = "completed";
    await task.save();

    return res.status(200).json({
      message: "Task marked as completed",
      task
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// 🟢 MARK TASK AS EXPIRED
export const expireTask = async (req, res) => {
  const { id } = req.params;

  try {
    const task = await TaskModel.findById(id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (task.status === "completed") {
      return res.status(400).json({ message: "Task is already completed" });
    }

    task.status = "expired";
    await task.save();

    return res.status(200).json({
      message: "Task marked as expired",
      task
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// 🟢 GET FAVORITE TASKS
export const getFavoriteTasks = async (req, res) => {
  try {
    const favoriteTasks = await TaskModel.find({
      userId: req.userId,
      is_favorite: true,
      status: { $ne: "deleted" }
    });

    return res.status(200).json(favoriteTasks);
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
