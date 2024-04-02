import {
  AddTask,
  deleteNotification,
  getCompletedTask,
  getInProgressTask,
  getNotification,
  getTask,
  getTaskNotification,
  getTodoTask,
  updateTask,
  updateTaskNotification,
  updateTaskComment,
  getTaskById,
} from "./taskController.js";
import express from "express";

const taskRouter = express.Router();

taskRouter.post("/add-task", AddTask);
taskRouter.get("/get-task/:userId", getTask);
taskRouter.get("/get-todo-task/:userId", getTodoTask);
taskRouter.get("/get-in-progress-task/:userId", getInProgressTask);
taskRouter.get("/get-completed-task/:userId", getCompletedTask);
taskRouter.get("/notification/:userId", getTaskNotification);
taskRouter.get("/new-notification/:userId", getNotification);
taskRouter.put("/update-task", updateTask);
taskRouter.put("/update-notification/:userId", updateTaskNotification);
taskRouter.put("/delete-notification/:id", deleteNotification);
taskRouter.put("/add-comment/:id", updateTaskComment);
taskRouter.put("/add-comment/:id", updateTaskComment);
taskRouter.get("/task-by-id/:id", getTaskById);

export default taskRouter;
