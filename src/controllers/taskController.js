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

export const updateTask = async (req, res) => {
  try {
    const { id: updaterId, type } = req.user;
    const { id, title, description, to_date, userId, status } = req.body;

    let assignedUserId = null;
    let isPublic = false;

    // 👇 Determine the companyId
    let companyId;
    if (type === "company") {
      companyId = updaterId;
    } else {
      if (!req.body.companyId) {
        return res.status(400).json({
          message: "Missing companyId in body for employee task"
        });
      }
      companyId = req.body.companyId;
    }

    // 👇 Assign user logic
    if (type === "company") {
      if (!userId) {
        isPublic = true;
      } else {
        assignedUserId = userId;
      }
    } else {
      assignedUserId = updaterId;
    }

    // 👇 Prepare update payload
    const updatePayload = {
      title,
      description,
      to_date,
      companyId,
      userIds: assignedUserId ? [assignedUserId] : [],
      updatedBy: updaterId,
      isPublic
    };

    // 👇 Include status and handle side effects
    if (status) {
      updatePayload.status = status;

      if (status === "completed") {
        updatePayload.completedAt = new Date();
        updatePayload.completedBy = updaterId;
      }

      if (status === "deleted") {
        updatePayload.is_deleted = true;
        updatePayload.deletedAt = new Date();
      }
    }

    // 👇 Update task
    const updatedTask = await TaskModel.findByIdAndUpdate(id, updatePayload, {
      new: true
    });

    if (!updatedTask) {
      return res.status(404).json({
        status: "fail",
        message: "Task not found"
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Task updated successfully",
      task: updatedTask
    });
  } catch (err) {
    console.error("Update Task Error:", err);
    return res.status(500).json({
      status: "fail",
      message: "Failed to update task"
    });
  }
};

export const getTasks = async (req, res) => {
  try {
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

    const tasks = await TaskModel.find(query)
      .populate("createdBy", "full_name email id") // ✅ correct field
      .populate("userIds", "full_name email id")
      .populate("completedBy", "full_name email id")
      .sort({ createdAt: -1 });

    res.status(200).json({ status: "success", tasks });
  } catch (error) {
    console.error("Get Tasks Error:", error);
    res.status(500).json({ status: "fail", message: "Failed to get tasks" });
  }
};

export const getDeletedTasks = async (req, res) => {
  try {
    const { id: userId, type } = req.user;

    let query = {
      is_deleted: true
    };

    if (type === "company") {
      query.companyId = userId;
    } else {
      query.$or = [{ userIds: userId }, { createdBy: userId }];
    }

    const tasks = await TaskModel.find(query)
      .populate("createdBy", "full_name email id")
      .populate("userIds", "full_name email id")
      .populate("completedBy", "full_name email id")
      .sort({ updatedAt: -1 });

    res.status(200).json({ status: "success", tasks });
  } catch (error) {
    console.error("Get Deleted Tasks Error:", error);
    res
      .status(500)
      .json({ status: "fail", message: "Failed to get deleted tasks" });
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
      console.log("Setting completedBy to:", userId);
      task.completedAt = new Date();
      task.completedBy = userId;
      task.markModified("completedBy"); // important!
    }

    if (status === "deleted") {
      task.is_deleted = true;
      task.deletedAt = new Date();
    }

    await task.save();
    console.log("Saved task:", task);

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


export const getUserTasks = async (req, res) => {
  try {
    const userId = req.user.id;

    const tasks = await TaskModel.find({
      $or: [
        { userIds: mongoose.Types.ObjectId(userId) },
        { isPublic: true, userIds: { $size: 0 } }
      ],
      is_deleted: false
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Data Fetched....",
      data: tasks
    });

  } catch (error) {
    console.error("Error", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
}