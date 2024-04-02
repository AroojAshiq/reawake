import dotenv from "dotenv";
import Users from "./data/user.js";
import User from "./user/userModel.js";
import connnectDb from "./config/db.js";

dotenv.config();

const MONGO_DB = process.env.MONGO_DB;
connnectDb(MONGO_DB);

const importData = async () => {
  try {
    await User.insertMany(Users);
    console.log("user imported");
  } catch (error) {
    console.log(error?.message);
    process.exit(1);
  }
};

const deleteData = async () => {
  try {
    await User.deleteMany(Users);
    console.log("user deleted");
  } catch (error) {
    console.log(error?.message);
    process.exit(1);
  }
};

if (process.argv[2] === "-import") {
  importData();
} else if (process.argv[2] === "-remove ") {
  deleteData();
}
