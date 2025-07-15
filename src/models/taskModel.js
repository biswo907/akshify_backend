import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const taskSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      default: uuidv4,
      unique: true
    },

    title: {
      type: String,
      required: true
    },

    description: {
      type: String,
      default: ""
    },

    // Assigned to employees (optional, multiple)
    userIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],

    // Company who created or owns the task
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true
    },

    // Who created the task (company or employee)
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    // Last user who updated the status (in-progress, completed, deleted, etc.)
    statusUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    // When the status was last updated
    statusUpdatedAt: {
      type: Date,
      default: null
    },

    // If completed, timestamp (for reports)
    completedAt: {
      type: Date,
      default: null
    },

    // If deleted, timestamp
    deletedAt: {
      type: Date,
      default: null
    },

    // Optional: If a task has an expiry/deadline
    to_date: {
      type: Date,
      default: null
    },

    // Task Status
    status: {
      type: String,
      enum: ["pending", "in-progress", "completed", "expired", "deleted"],
      default: "pending"
    },

    // Soft-delete flag
    is_deleted: {
      type: Boolean,
      default: false
    },

    // If the task is visible to all employees
    isPublic: {
      type: Boolean,
      default: false
    },

    // When task was assigned to someone
    assignedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true // Adds createdAt and updatedAt automatically
  }
);

export default mongoose.model("Task", taskSchema);
