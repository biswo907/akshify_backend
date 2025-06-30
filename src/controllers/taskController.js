import UserModel from "../models/user.js";
import TaskModel from "../models/taskModel.js";

export const createTask = async (req, res) => {
  try {
    const { id: creatorId, type } = req.user;
    const { title, description, to_date, userId } = req.body;

    let assignedUserId = null;
    let isPublic = false;

    // 👇 Dynamically determine the companyId
    let companyId;
    if (type === "company") {
      companyId = creatorId; // company is creating the task
    } else {
      if (!req.body.companyId) {
        return res
          .status(400)
          .json({ message: "Missing companyId in body for employee task" });
      }
      companyId = req.body.companyId; // employee must send companyId in request body
    }

    // 👇 Assign user logic
    if (type === "company") {
      if (!userId) {
        isPublic = true; // show to all employees
      } else {
        assignedUserId = userId; // assigned to one employee
      }
    } else {
      assignedUserId = creatorId; // employee assigns task to themselves
    }

    // 👇 Create task
    await TaskModel.create({
      title,
      description,
      to_date,
      companyId,
      userIds: assignedUserId ? [assignedUserId] : [],
      createdBy: creatorId,
      isPublic
    });

    return res.status(201).json({
      status: "success",
      message: "Task created successfully"
    });
  } catch (err) {
    console.error("Create Task Error:", err);
    return res.status(500).json({
      status: "fail",
      message: "Failed to create task"
    });
  }
};

export const getTasks = async (req, res) => {
  try {
    // ✅ Auto-expire outdated tasks before fetching
    await autoExpireTasks();

    const { id: userId, type } = req.user;

    let query = {
      is_deleted: false
    };

    if (type === "company") {
      query.companyId = userId;
    } else {
      query.$or = [
        { isPublic: true },
        { userIds: userId },
        { createdBy: userId }
      ];
    }

    const tasks = await TaskModel.find(query).sort({ createdAt: -1 });
    res.status(200).json({ status: "success", tasks });
  } catch (error) {
    console.error("Get Tasks Error:", error);
    res.status(500).json({ status: "fail", message: "Failed to get tasks" });
  }
};

export const toggleTaskStatus = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { taskId, status } = req.body; // ✅ Now both come from body

    if (!taskId || !status) {
      return res
        .status(400)
        .json({ message: "taskId and status are required" });
    }

    if (!["pending", "in-progress", "completed", "deleted"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const task = await TaskModel.findById(taskId);
    if (!task || task.is_deleted) {
      return res.status(404).json({ message: "Task not found" });
    }

    const isOwner = task.createdBy.toString() === userId;
    const isAssignee = task.userIds.map(id => id.toString()).includes(userId);

    if (!isOwner && !isAssignee) {
      return res
        .status(403)
        .json({ message: "Unauthorized to update this task" });
    }

    task.status = status;

    if (status === "completed") {
      task.completedAt = new Date();
    }

    if (status === "deleted") {
      task.is_deleted = true;
      task.deletedAt = new Date();
    }

    await task.save();

    res.status(200).json({
      status: "success",
      message: `Task status updated to ${status}`
    });
  } catch (error) {
    console.error("Toggle Task Status Error:", error);
    res
      .status(500)
      .json({ status: "fail", message: "Could not update status" });
  }
};

export const autoExpireTasks = async () => {
  const now = new Date();
  const expiredTasks = await TaskModel.updateMany(
    {
      status: { $ne: "completed" },
      to_date: { $lt: now },
      status: { $ne: "expired" },
      is_deleted: false
    },
    {
      $set: {
        status: "expired",
        expiredAt: now
      }
    }
  );
  console.log(`Expired ${expiredTasks.modifiedCount} tasks`);
};
