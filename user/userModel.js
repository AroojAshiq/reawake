import mongoose from "mongoose";

const userSchema = mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    trim: true,
  },
  phoneNumber: {
    type: String,
    trim: true,
  },
  filename: {
    type: String,
    trim: true,
  },
  role: {
    type: String,
    trim: true,
  },
  subscriptionId: {
    type: String,
    trim: true,
  },
  subType: {
    type: String,
    trim: true,
  },
});

const User = mongoose.model("User", userSchema);

export default User;
