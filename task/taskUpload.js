import path from "path";
import express from "express";
import multer from "multer";
import Task from "./taskModel.js";
import fs from "fs";
const taskRoute = express.Router();

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, "attchments/");
  },
  filename(req, file, cb) {
    cb(null, `${Date.now()}.${file.originalname}`);
  },
});

function checkFileType(file, cb) {
  const filetypes = /jpg|jpeg|png|jfif|pdf/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb("Your allowed to uopload images only", false);
  }
}

const upload = multer({
  storage,
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // limit to 2MB
  },
});

taskRoute.put("/task/:id", upload.single("filename"), async (req, res) => {
  const { taskName, comment, taskStatus, date, time, dueDate } = req.body;
  const { id } = req.params;
  const filename = req?.file?.filename;
  const fileOriginalName = req?.file?.originalname;
  const task = await Task.findById(id);
  if (
    taskName ||
    comment ||
    fileOriginalName ||
    filename ||
    taskStatus ||
    date ||
    time ||
    dueDate
  ) {
    try {
      if (task) {
        if (task?.filename?.length && filename?.length) {
          removeImage(task?.filename);
        }
        task.taskName = taskName || task.taskName;
        task.taskStatus = taskStatus || task.taskStatus;
        task.dueDate = dueDate || task.dueDate;
        if (date || time) {
          task.reminder = {
            date: date || task?.reminder.date,
            time: time || task?.reminder.time,
          };
        }
        task.fileOriginalName = fileOriginalName || task.fileOriginalName;
        task.filename = filename ?? task.filename;
        const savetask = await task.save();
        if (savetask) {
          res.status(200).json({
            success: true,
            message: "Task updated successfully",
            task: {
              taskName: savetask?.taskName,
              fileOriginalName: savetask?.fileOriginalName,
              filename: savetask?.filename,
            },
          });
        } else {
          res.status(400).json({
            success: false,
            message: "something wents wrong",
          });
        }
      }
    } catch (error) {
      console.log(error, "error");
      res.status(400).json({
        success: false,
        message: "something wents wrong",
      });
    }
  } else {
    res.status(400).json({
      success: false,
      message: "something wents wrong",
    });
  }
});

export default taskRoute;

const removeImage = (file) => {
  fs.unlink("./attchments/" + file, function (err) {
    if (err && err.code == "ENOENT") {
      // file doens't exist
      console.info("File doesn't exist, won't remove it.");
    } else if (err) {
      // other errors, e.g. maybe we don't have enough permission
      console.error("Error occurred while trying to remove file");
    } else {
      console.info(`removed`);
    }
  });
};
