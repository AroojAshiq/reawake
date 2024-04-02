import User from "./userModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import sgMail from "@sendgrid/mail";

const Signup = async (req, res) => {
  const { firstName, lastName, phoneNumber, email, password } = req.body;

  const user = await User.findOne({ email: email });
  if (user) {
    res.status(400).json({
      success: false,
      message: "User already exist",
    });
  } else {
    if (firstName && lastName && email && password && phoneNumber) {
      try {
        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
          firstName: firstName,
          email: email,
          password: hashPassword,
          lastName: lastName,
          phoneNumber: phoneNumber,
        });
        await newUser.save();

        const saveUser = await User.findOne({ email: email });
        const token = jwt.sign(
          { userId: saveUser._id },
          process.env.JWT_SECRET,
          { expiresIn: "30d" }
        );
        if (saveUser) {
          // welcomeMail(saveUser);
        }
        res.status(200).json({
          success: true,
          message: "Signup successful",
          userID: saveUser._id,
          firstName: saveUser.firstName,
          lastName: saveUser.lastName,
          email: saveUser.email,
          phoneNumber: saveUser.phoneNumber,
          token: token,
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
        message: "Please fill empty fields",
      });
    }
  }
};

const Login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (email && password) {
      const user = await User.findOne({ email: email });
      if (user != null) {
        const isMatch = await bcrypt.compare(password, user.password);
        if (user.email == email && isMatch) {
          const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
            expiresIn: "30m",
          });

          res.status(200).json({
            success: true,
            message: "Sign in successful",
            userId: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            phoneNumber: user.phoneNumber,
            filename: user.filename,
            email: user.email,
            token: token,
            role: user.role,
          });
        } else {
          res.status(400).json({
            success: false,
            message:
              "Wrong Username/Password. Try again or click forgot password to reset it.",
          });
        }
      } else {
        res.status(400).json({
          success: false,
          message: "the user is not registered",
        });
      }
    } else {
      res.status(400).json({
        success: false,
        message: "Please fill empty fields",
      });
    }
  } catch (error) {
    res.status(500).json(error.message);
  }
};

const forgetPassword = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email: email });
  if (user) {
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    sendForgetPasswordLink(user, token);
    res.status(200).json({
      success: true,
      message:
        "Email Sent. Please check your email for password reset instructions",
    });
  } else {
    res.status(400).json({
      success: false,
      message: "Email Not Found",
    });
  }
};

const updateForgetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  const { id } = jwt.verify(token, process.env.JWT_SECRET);
  if (id) {
    try {
      const salt = await bcrypt.genSalt(10);
      const hashPassword = await bcrypt.hash(password, salt);

      await User.findByIdAndUpdate(id, { password: hashPassword });
      res.status(200).json({
        success: true,
        message: "Password Updated Successfully",
      });
    } catch {
      res.status(400).json({
        success: false,
        message: "Something wents wrong",
      });
    }
  } else {
    res.status(400).json({
      success: false,
      message: "Something wents wrong",
    });
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    if (id) {
      const user = await User.findById(id).select("-password");
      if (user) {
        res.status(200).json({
          success: true,
          message: "User Details",
          user,
        });
      } else {
        res.status(400).json({
          success: false,
          message: "User not found",
        });
      }
    } else {
      res.status(400).json({
        success: false,
        message: "User id not found",
      });
    }
  } catch (error) {
    res.status(500).json(error.message);
  }
};

export { Signup, Login, forgetPassword, updateForgetPassword, getUserById };

const sendForgetPasswordLink = (user, token) => {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  const msg = {
    to: `${user?.email}`,
    from: {
      name: "re-awake",
      email: "ziaareact@gmail.com",
    }, // Use the email address or domain you verified above
    subject: "Password Reset Request.",
    text: `Reset your password?`,
    html: `<p>If you requested a password reset for ${user?.email}, click the button below. This link will expire in 1 hour. If you didn’t make this request, please ignore and contact your administrator.</p> 
    <a href=http://localhost:3000/forget-password/${token} style="text-decoration: none;">
    <button style="background-color: blue; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;">
        Click here
    </button>
</a>`,
  };
  try {
    sgMail.send(msg);
  } catch (error) {
    console.log(error);
    return error;
  }
};

const welcomeMail = (user) => {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  const msg = {
    to: `${user?.email}`,
    from: {
      name: "Reawake",
      email: "ziaareact@gmail.com",
    }, // Use the email address or domain you verified above
    subject: "Welcome to reawake.",
    text: `You have successfully signed up to Reawaken.`,
    html: `<p style="text-transform: capitalize">${user?.firstName}</p> 

    <p>You don't have to wait to experience <strong>reawake</strong>. As a welcome to our community,</p> 
    <p> If you need any help or guidance, just get in touch with us.</p>
    <p style="margin-top:20px">Thank you!</p> `,
  };
  try {
    sgMail.send(msg);
  } catch (error) {
    console.log(error);
    return error;
  }
};
