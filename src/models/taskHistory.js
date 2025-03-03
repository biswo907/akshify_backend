import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const taskHistorySchema = new mongoose.Schema(
  {
    id: {
      type: String,
      default: uuidv4,
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
    task_status: {
      type: String,
      enum: ["expired", "completed"],
      required: true
    },
    recorded_at: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: false } // No need for updatedAt here
);

const TaskHistoryModel = mongoose.model("TaskHistory", taskHistorySchema);
export default TaskHistoryModel;
