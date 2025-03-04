import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const deletedTaskSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      default: uuidv4, // Generate UUID for deleted tasks
      unique: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      unique: true,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    description: String,
    task_color: String,
    task_font_family: String,
    description_color: String,
    description_font_family: String,
    from_date: {
      type: Date,
      default: null
    },
    to_date: {
      type: Date,
      default: null
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium"
    },
    status: {
      type: String,
      enum: ["pending", "in-progress", "completed", "expired", "deleted"],
      default: "deleted"
    },
    is_favorite: {
      type: Boolean,
      default: false
    },
    expiredAt: {
      type: Date,
      default: null
    },
    deleted_at: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: false } // No need for updatedAt since it's a deleted record
);

const DeletedTaskModel = mongoose.model("DeletedTask", deletedTaskSchema);
export default DeletedTaskModel;
