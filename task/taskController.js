import Task from "./taskModel.js";

const AddTask = async (req, res) => {
  const { taskName, taskStatus, dueDate, date, time, userId } = req.body;

  if (taskName && taskStatus && userId) {
    try {
      const newTask = new Task({
        taskName: taskName,
        reminder: {
          date: date,
          time: time,
        },
        userId: userId,
        taskStatus: taskStatus,
        dueDate: dueDate,
        notification: {
          message: `You have created ${taskStatus} task`,
          isOpen: false,
        },
      });
      const saveTask = await newTask.save();

      res.status(200).json({
        success: true,
        message: "Task added successfully",
        id: saveTask?._id,
        saveTask,
      });
    } catch (error) {
      console.log(error.message);
      res.status(500).json({
        success: false,
        mesaage: "Something wents wrong",
      });
    }
  } else {
    res.status(400).json({
      success: false,
      message: "Task name and task status is required",
    });
  }
};

const getTask = async (req, res) => {
  const { userId } = req.params;

  if (userId) {
    try {
      const values = await Task.find({ userId: userId }).populate(
        "userId",
        "-password"
      );
      res.status(200).json({
        success: true,
        message: "All tasks",
        data: values,
      });
    } catch (error) {
      console.log(error.message);
      res.status(500).json({
        success: false,
        message: "Something went wrong",
      });
    }
  } else {
    res.status(400).json({
      success: false,
      message: "User Id does not exist",
    });
  }
};

const getTodoTask = async (req, res) => {
  const { userId } = req.params;

  if (userId) {
    try {
      const values = await Task.find({
        userId: userId,
        taskStatus: "Todo",
      }).populate("userId", "-password");
      res.status(200).json({
        success: true,
        message: "All tasks",
        data: values,
      });
    } catch (error) {
      console.log(error.message);
      res.status(500).json({
        success: false,
        message: "Something went wrong",
      });
    }
  } else {
    res.status(400).json({
      success: false,
      message: "User Id does not exist",
    });
  }
};

const getInProgressTask = async (req, res) => {
  const { userId } = req.params;

  if (userId) {
    try {
      const values = await Task.find({
        userId: userId,
        taskStatus: "In Progress",
      }).populate("userId", "-password");
      res.status(200).json({
        success: true,
        message: "All tasks",
        data: values,
      });
    } catch (error) {
      console.log(error.message);
      res.status(500).json({
        success: false,
        message: "Something went wrong",
      });
    }
  } else {
    res.status(400).json({
      success: false,
      message: "User Id does not exist",
    });
  }
};

const getCompletedTask = async (req, res) => {
  const { userId } = req.params;

  if (userId) {
    try {
      const values = await Task.find({
        userId: userId,
        taskStatus: "Completed",
      }).populate("userId", "-password");
      res.status(200).json({
        success: true,
        message: "All tasks",
        data: values,
      });
    } catch (error) {
      console.log(error.message);
      res.status(500).json({
        success: false,
        message: "Something went wrong",
      });
    }
  } else {
    res.status(400).json({
      success: false,
      message: "User Id does not exist",
    });
  }
};

const updateTask = async (req, res) => {
  const { taskId, taskStatus } = req.body;

  try {
    const values = await Task.findByIdAndUpdate(
      { _id: taskId },
      { $set: { taskStatus: taskStatus } }
    );
    res.status(200).json({
      success: true,
      message: "Task Updated",
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

const getTaskNotification = async (req, res) => {
  const { userId } = req.params;
  const projection = {
    notification: 1,
    createdAt: 1,
    reminder: 1,
  };
  if (userId) {
    try {
      const values = await Task.find(
        {
          userId: userId,
        },
        projection
      ).sort({ createdAt: -1 });
      res.status(200).json({
        success: true,
        message: "All tasks",
        data: values,
      });
    } catch (error) {
      console.log(error.message);
      res.status(500).json({
        success: false,
        message: "Something went wrong",
      });
    }
  } else {
    res.status(400).json({
      success: false,
      message: "User Id does not exist",
    });
  }
};

const updateTaskNotification = async (req, res) => {
  const { userId } = req.params;

  try {
    await Task.updateMany(
      { userId: userId },
      { $set: { "notification.isOpen": true } }
    );
    res.status(200).json({
      success: true,
      message: "Task Updated",
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

const getNotification = async (req, res) => {
  const { userId } = req.params;
  const projection = {
    notification: 1,
  };
  if (userId) {
    try {
      const values = await Task.find(
        {
          userId: userId,
          "notification.isOpen": false,
        },
        projection
      );
      res.status(200).json({
        success: true,
        message: "All tasks",
        data: values,
      });
    } catch (error) {
      console.log(error.message);
      res.status(500).json({
        success: false,
        message: "Something went wrong",
      });
    }
  } else {
    res.status(400).json({
      success: false,
      message: "User Id does not exist",
    });
  }
};

const deleteNotification = async (req, res) => {
  const { id } = req.params;
  const update = { $unset: { notification: 1 } };
  if (id) {
    try {
      await Task.updateOne({ _id: id }, update);
      res.status(200).json({
        success: true,
        message: "Task deleted",
      });
    } catch (error) {
      console.log(error.message);
      res.status(500).json({
        success: false,
        message: "Something went wrong",
      });
    }
  } else {
    res.status(400).json({
      success: false,
      message: "Task Id do not exist",
    });
  }
};

const updateTaskComment = async (req, res) => {
  const { id } = req.params;
  const { comment } = req.body;
  const newComment = {
    text: comment,
  };
  try {
    await Task.updateMany({ _id: id }, { $push: { comment: newComment } });
    res.status(200).json({
      success: true,
      message: "comments",
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

const getTaskById = async (req, res) => {
  const { id } = req.params;

  if (id) {
    try {
      const values = await Task.findById(id);
      res.status(200).json({
        success: true,
        message: "All tasks",
        data: values,
      });
    } catch (error) {
      console.log(error.message);
      res.status(500).json({
        success: false,
        message: "Something went wrong",
      });
    }
  } else {
    res.status(400).json({
      success: false,
      message: "User Id does not exist",
    });
  }
};

export {
  AddTask,
  getTask,
  getTodoTask,
  getCompletedTask,
  getInProgressTask,
  updateTask,
  getTaskNotification,
  updateTaskNotification,
  getNotification,
  deleteNotification,
  updateTaskComment,
  getTaskById,
};
