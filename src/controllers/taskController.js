import mongoose from "mongoose";
import TaskModel from "../models/task.js";
import DeletedTaskModel from "../models/deletedTask.js";
import TaskHistoryModel from "../models/taskHistory.js";

//  GET ALL TASKS
export const getActiveTasks = async (req, res) => {
  try {
    // Fetch all tasks for the logged-in user
    const tasks = await TaskModel.find({ userId: req.userId });

    res.status(200).json({
      success: true,
      count: tasks.length,
      tasks
    });
  } catch (error) {
    console.error("Error fetching active tasks:", error);
    res.status(500).json({ success: false, message: "Failed to fetch tasks", error: error.message });
  }
};




//  CREATE TASK
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

//  Task Details API
export const taskDetails = async (req, res) => {
  const taskId = req.query.taskId ?? req.body.taskId; // Check both query and body

  if (!taskId) {
    return res.status(400).json({ message: "Task ID is required" });
  }

  try {
    const task = await TaskModel.findById(taskId);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    return res.status(200).json({ task });
  } catch (error) {
    console.error("Task Details Error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};


//  UPDATE TASK
export const updateTask = async (req, res) => {
  const { id, ...updateFields } = req.body;

  console.log("Task ID:", id); // Debugging log

  if (!id) {
    return res.status(400).json({ message: "Task ID is required" });
  }

  try {
    const updatedTask = await TaskModel.findByIdAndUpdate(id, updateFields, { new: true });

    if (!updatedTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    return res.status(200).json({ message: "Task Updated Successfully", task: updatedTask });
  } catch (error) {
    console.error("Error updating task:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};


//  DELETE TASK (Move to Deleted History)
export const deleteTask = async (req, res) => {
  try {
    const taskId = req.params.id || req.body.taskId || req.query.taskId;

    if (!taskId || !mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({ error: "Invalid or missing Task ID" });
    }

    // Check if task is already deleted
    const existingDeleted = await DeletedTaskModel.findOne({ taskId });
    if (existingDeleted) {
      return res.status(400).json({ error: "Task is already deleted" });
    }

    // Find the task before deleting
    const task = await TaskModel.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Move full task data to DeletedTaskModel
    const deletedTask = new DeletedTaskModel({
      ...task.toObject(),
      taskId: task._id,
      status: "deleted",
      deleted_at: new Date()
    });

    await deletedTask.save();
    await TaskModel.findByIdAndDelete(taskId);

    return res.status(200).json({ message: "Task deleted and moved to history" });
  } catch (error) {
    console.error("Delete Task Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};


//  GET DELETED TASKS
export const getDeletedTasks = async (req, res) => {
  try {
    const deletedTasks = await DeletedTaskModel.find({ userId: req.userId });

    if (!deletedTasks.length) {
      return res.status(404).json({ message: "No deleted tasks found" });
    }

    return res.status(200).json({ deletedTasks });
  } catch (error) {
    console.error("Get Deleted Tasks Error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};



//  GET TASK HISTORY (Completed & Expired)
export const getTaskHistory = async (req, res) => {
  try {
    const tasks = await TaskHistoryModel.find({ userId: req.userId });

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



//  Change Task Status
export const changeStatus = async (req, res) => {
  try {
    const { taskId, status } = req.body;

    if (!taskId || !mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({ error: "Invalid or missing Task ID" });
    }

    // Find the task
    const task = await TaskModel.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    const currentDate = new Date();

    // 🔹 If task is "in-progress" but the due date has passed, mark it as expired
    if (task.status === "in-progress" && task.to_date && new Date(task.to_date) < currentDate) {
      return res.status(400).json({ error: "Task expired and cannot be updated" });
    }

    // ✅ If status is "in-progress", update only the status
    if (status === "in-progress") {
      const updatedTask = await TaskModel.findByIdAndUpdate(
        taskId,
        { status },
        { new: true }
      );

      return res.status(200).json({ message: "Task marked as in-progress", updatedTask });
    }

    // ✅ If status is "completed", move task to history and delete from TaskModel
    if (status === "completed") {
      const taskHistory = new TaskHistoryModel({
        ...task.toObject(),
        taskId: task._id,
        status: "completed",
        completedAt: currentDate,
        recorded_at: currentDate
      });

      await taskHistory.save();
      await TaskModel.findByIdAndDelete(taskId);

      return res.status(200).json({ message: "Task moved to history", taskHistory });
    }

    return res.status(400).json({ error: "Invalid status update. Allowed: in-progress, completed" });

  } catch (error) {
    console.error("Change Status Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};



