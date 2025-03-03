import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const taskSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      default: uuidv4, // Generate UUID as default ID
      unique: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    title: {
      type: String,
      required: true
    },
    description: {
      type: String
    },
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
      enum: ["pending", "in-progress", "completed", "expired"],
      default: "pending"
    },
    is_favorite: {
      type: Boolean,
      default: false
    },
    expiredAt: {
      type: Date, // Store expiration timestamp
      default: null
    }
  },
  { timestamps: true }
);

const TaskModel = mongoose.model("Task", taskSchema);
export default TaskModel;
