import mongoose from "mongoose";

const taskSchema = mongoose.Schema(
  {
    taskName: {
      type: String,
      required: true,
      trim: true,
    },
    taskStatus: {
      type: String,
      required: true,
      trim: true,
    },
    dueDate: {
      type: String,
      // required: true,
      trim: true,
    },
    reminder: {
      date: {
        type: String,
        // required: true,
        trim: true,
      },
      time: {
        type: String,
        trim: true,
        // required: true,
      },
    },
    comment: [
      {
        text: String,
      },
    ],
    filename: {
      type: String,
    },
    fileOriginalName: {
      type: String,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    notification: {
      message: {
        type: String,
        trim: true,
      },
      isOpen: {
        type: Boolean,
        default: false,
      },
    },
  },
  { timestamps: true }
);

const Task = mongoose.model("Task", taskSchema);

export default Task;
