import jwt from "jsonwebtoken";
import User from "../model/userModel.js";

const checkAuthUser = async (req, res, next) => {
  let token;
  const { authorization } = req.headers;
  if (authorization && authorization.startsWith("Bearer")) {
    try {
      token = authorization.split(" ")[1];
      const { userId } = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(userId).select("-password");
      next();
    } catch (error) {
      res.status(501).json({
        success: false,
        message: "Unauthorized user",
      });
    }
  }
  if (!token) {
    res.status(401).json({
      success: false,
      message: "Session has expired, please log in again.",
    });
  }
};
export default checkAuthUser;
