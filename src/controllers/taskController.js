import UserModel from "../models/user.js";
import TaskModel from "../models/taskModel.js";

// Create Task (Both Company and Employee)
export const createTask = async (req, res) => {
  try {
    const { id: creatorId, type } = req.user;
    const {
      title,
      description,
      to_date,
      userId // Optional if created by company
    } = req.body;

    let assignedUserId = null;
    let isPublic = false;
    let companyId = req.user.companyId || creatorId;

    if (type === "company") {
      if (!userId) {
        isPublic = true;
      } else {
        assignedUserId = userId;
      }
    } else {
      assignedUserId = creatorId;
    }

    await TaskModel.create({
      title,
      description,
      to_date,
      companyId,
      userId: assignedUserId,
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

// Get Tasks (Company: all their tasks; Employee: only their own)
// controllers/taskController.js
export const getTasks = async (req, res) => {
  try {
    const { id, type, companyId } = req.user;

    const query = { is_deleted: false };

    if (type === "employee") {
      query.$or = [
        { userIds: id },
        { isPublic: true, companyId },
        { createdBy: id }
      ];
    } else if (type === "company") {
      const employeeIds = await getEmployeeIdsOfCompany(id);
      query.$or = [
        { companyId: id }, // Tasks company created
        { createdBy: { $in: employeeIds } } // Tasks created by employees
      ];
    }

    const tasks = await TaskModel.find(query)
      .populate("userIds", "full_name email")
      .populate("companyId", "full_name email")
      .populate("createdBy", "full_name email");

    res.status(200).json({
      status: "success",
      tasks
    });
  } catch (error) {
    console.error("Get Tasks Error:", error);
    res.status(500).json({
      status: "fail",
      message: "Server error fetching tasks"
    });
  }
};

// Helper to get all employees of a company
const getEmployeeIdsOfCompany = async companyId => {
  const employees = await UserModel.find({
    companyId,
    type: "employee"
  }).select("_id");
  return employees.map(e => e._id);
};

//  updating task status
export const updateTaskStatus = async (req, res) => {
  try {
    const { id: userId, type } = req.user;
    const { id: taskId } = req.params;
    const { status } = req.body;

    const validStatuses = [
      "pending",
      "in-progress",
      "completed",
      "expired",
      "deleted"
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: `Invalid status: ${status}` });
    }

    const task = await TaskModel.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Authorization: company can update tasks of their company, employee can update own tasks
    const isCompany =
      type === "company" && String(task.companyId) === String(userId);
    const isEmployee =
      type === "employee" && String(task.userId) === String(userId);

    if (!isCompany && !isEmployee) {
      return res
        .status(403)
        .json({ message: "You are not authorized to update this task" });
    }

    // Handle status change logic
    if (status === "deleted") {
      task.is_deleted = true;
      task.status = "deleted";
    } else {
      task.is_deleted = false;
      task.status = status;

      // Completed status
      if (status === "completed") {
        task.completedAt = new Date();
      } else if (task.completedAt && status !== "completed") {
        task.completedAt = null;
      }

      // Expired status
      if (status === "expired") {
        task.expiredAt = new Date();
      } else if (task.expiredAt && status !== "expired") {
        task.expiredAt = null;
      }

      // Reset expiredAt if deadline extended and status not expired
      if (status !== "expired" && task.to_date && task.to_date > new Date()) {
        task.expiredAt = null;
      }
    }

    await task.save();

    res.status(200).json({ message: `Task status updated to ${status}`, task });
  } catch (error) {
    console.error("Update Task Status Error:", error);
    res.status(500).json({ message: "Server error updating task" });
  }
};
