import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const deletedTaskSchema = new mongoose.Schema(
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
    deleted_at: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: false } // No need for updatedAt since it’s a deleted record
);

const DeletedTaskModel = mongoose.model("DeletedTask", deletedTaskSchema);
export default DeletedTaskModel;
