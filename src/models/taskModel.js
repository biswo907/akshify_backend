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
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference to the User who completed the task
      default: null
    },

    // Dates
    to_date: Date,
    completedAt: Date,
    expiredAt: Date,
    deletedAt: Date,

    // Status
    status: {
      type: String,
      enum: ["pending", "in-progress", "completed", "expired", "deleted"],
      default: "pending"
    },
    is_deleted: {
      type: Boolean,
      default: false
    },
    isPublic: {
      type: Boolean,
      default: false
    },
    assignedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model("Task", taskSchema);
