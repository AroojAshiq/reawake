import path from "path";
import express from "express";
import multer from "multer";
import User from "./userModel.js";
import fs from "fs";
import bcrypt from "bcryptjs";
const profileRoute = express.Router();

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, "uploads/");
  },
  filename(req, file, cb) {
    cb(null, `${Date.now()}.${file.originalname}`);
  },
});

function checkFileType(file, cb) {
  const filetypes = /jpg|jpeg|png|jfif/;
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

profileRoute.put(
  "/setting/:id",
  upload.single("filename"),
  async (req, res) => {
    const {
      firstName,
      lastName,
      phoneNumber,
      email,
      oldPassword,
      newPassword,
    } = req.body;
    const { id } = req.params;
    const filename = req?.file?.filename;
    const user = await User.findById(id);

    if (
      firstName ||
      phoneNumber ||
      lastName ||
      email ||
      oldPassword ||
      newPassword ||
      filename
    ) {
      if (oldPassword && newPassword) {
        const isMatch = await bcrypt.compare(oldPassword, user.password);

        if (oldPassword && newPassword && oldPassword !== newPassword) {
          const salt = await bcrypt.genSalt(10);
          const newHashPassword = await bcrypt.hash(newPassword, salt);
          try {
            if (user && isMatch) {
              if (user?.filename?.length && filename?.length) {
                removeImage(user?.filename);
              }
              user.firstName = firstName || user.firstName;
              user.lastName = lastName || user.lastName;
              user.phoneNumber = phoneNumber || user.phoneNumber;
              user.password = newHashPassword || user.password;
              user.email = email || user.email;
              user.filename = filename ?? user.filename;
              const saveUser = await user.save();

              if (saveUser) {
                res.status(200).json({
                  success: true,
                  message: "success",
                  user: {
                    firstName: saveUser?.firstName,
                    filename: saveUser?.filename,
                    phoneNumber: saveUser?.phoneNumber,
                    email: saveUser?.email,
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
            message:
              "Both old password and new password are required for changing password",
          });
        }
      } else {
        try {
          if (user) {
            if (user?.filename?.length && filename?.length) {
              removeImage(user?.filename);
            }
            user.firstName = firstName || user.firstName;
            user.lastName = lastName || user.lastName;
            user.phoneNumber = phoneNumber || user.phoneNumber;
            user.email = email || user.email;
            user.filename = filename ?? user.filename;
            const saveUser = await user.save();

            if (saveUser) {
              res.status(200).json({
                success: true,
                message: "success",
                user: {
                  firstName: saveUser?.firstName,
                  lastName: saveUser?.lastName,
                  filename: saveUser?.filename,
                  phoneNumber: saveUser?.phoneNumber,
                  email: saveUser?.email,
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
      }
    } else {
      res.status(400).json({
        success: false,
        message: "something wents wrong",
      });
    }
  }
);

export default profileRoute;

const removeImage = (file) => {
  fs.unlink("./uploads/" + file, function (err) {
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
