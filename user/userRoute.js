import {
  Signup,
  Login,
  forgetPassword,
  updateForgetPassword,
  getUserById,
} from "./userController.js ";
import bodyParser from "body-parser";
import express from "express";
const app = express();

const router = express.Router();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

router.post("/signup", Signup);
router.post("/login", Login);
router.post("/forget-password", forgetPassword);
router.post("/forget-password/:token", updateForgetPassword);
router.get("/get-user-by-id/:id", getUserById);

export default router;
