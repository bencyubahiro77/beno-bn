const User = require("../models/userModel");
const asyncHandler = require("express-async-handler");
const Joi = require('joi');

const { generateToken } = require("../config/jwtToken");
const validateMongoDbId = require("../utils/validateMongodbId");
const { generateRefreshToken } = require("../config/refreshtoken");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const sendEmail = require("./emailCtrl");

const passwordSchema = Joi.string()
  .min(8)
  .pattern(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!]).*$/)
  .required()
  .messages({
    'string.min': 'Password must be at least 8 characters long',
    'string.pattern.base': 'Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 symbol',
    'any.required': 'Password is required'
});

//create a new user
const createUser = asyncHandler(
    async (req, res) => {
      const email = req.body.email;
      const mobile = req.body.mobile;
      const findUser = await User.findOne({ email: email });
      if (!findUser) {
        // Check if mobile number is 10 digits long
        if (mobile.length !== 10) {
          res.json({
            message: "Mobile number must be 10 digits long",
          });
          return;
        }
        // Validate the password
        const { error } = passwordSchema.validate(req.body.password);
        if (error) {
          res.json({
            message: error.details[0].message,
          });
          return;
        }
        const newUser = await User.create(req.body);
        res.json({
          message: "Signup successful",
          success: true,
          data: newUser
        });
      } else {
        throw new Error("User Already Exists");
      }
    }
);  

// Login a user
const loginUserCtrl = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    // check if user exists or not
    const findUser = await User.findOne({ email });
    if (findUser && (await findUser.isPasswordMatched(password))) {
        const refreshToken = await generateRefreshToken(findUser?._id);
        const updateuser = await User.findByIdAndUpdate(
            findUser.id,
            {
              refreshToken: refreshToken,
            },
            { new: true }
          );
          res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            maxAge: 72 * 60 * 60 * 1000,
          });
        res.json({
       _id: findUser?._id,
      email: findUser?.email,
      token: generateToken(findUser?._id),
        })
    } else {
        throw new Error("Invalid Credentials");
      }
});

// handle refresh token
const handleRefreshToken = asyncHandler(async (req, res) => {
    const cookie = req.cookies;
    if (!cookie?.refreshToken) throw new Error("No Refresh Token in Cookies");
    const refreshToken = cookie.refreshToken;
    const user = await User.findOne({ refreshToken });
    if (!user) throw new Error(" No Refresh token present in db or not matched");
    jwt.verify(refreshToken, process.env.JWT_SECRET, (err, decoded) => {
      if (err || user.id !== decoded.id) {
        throw new Error("There is something wrong with refresh token");
      }
      const accessToken = generateToken(user?._id);
      res.json({ accessToken });
    });
});

// logout functionality
const logout = asyncHandler(async (req, res) => {
    const cookie = req.cookies;
    if (!cookie?.refreshToken) throw new Error("No Refresh Token in Cookies");
    const refreshToken = cookie.refreshToken;
    const user = await User.findOne({ refreshToken });
    if (!user) {
      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: true,
      });
      return res.sendStatus(204); // forbidden
    }
    await User.findOneAndUpdate(refreshToken, {
      refreshToken: "",
    });
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: true,
    });
    res.sendStatus(204); // forbidden
  });

//update a user
const updatedUser = asyncHandler(async (req, res) => {
    console.log();
    const { _id } = req.user;
    validateMongoDbId(_id);
    try {
      const updatedUser = await User.findByIdAndUpdate(
        _id,
        {
          firstname: req?.body?.firstname,
          lastname: req?.body?.lastname,
          mobile: req?.body?.mobile,
        },
        {
          new: true,
        }
      );
      res.json(updatedUser);
    } catch (error) {
      throw new Error(error);
    }
});

// Get all users
const getallUser = asyncHandler(async (req, res) => {
    try {
      const getUsers = await User.find();
      res.json({ message: 'All users', data: getUsers });
    } catch (error) {
      throw new Error(error);
    }
});


//get single user
const getSingleUser = asyncHandler(async(req,res) =>{
    const { id } = req.params;
    validateMongoDbId(id);
    try{
        const getUser = await User.findById( id )
        res.json(getUser); 
    } catch(error){
        throw new Error(error);
    }
});

//delete single user
const deleteSingleUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    validateMongoDbId(id)
    try {
      await User.findByIdAndDelete(id);
      res.json({ message: 'User successfully deleted' });
    } catch (error) {
      throw new Error(error);
    }
});

//blocking a user
const blockUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    validateMongoDbId(id);
    try {
      const blockusr = await User.findByIdAndUpdate(
        id,
        {
          isBlocked: true,
        },
        {
          new: true,
        }
      );
      res.json({
        message: "User Blocked",
      });
    } catch (error) {
      throw new Error(error);
    }
});

//unblock user
const unblockUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    validateMongoDbId(id);
    try {
      const unblock = await User.findByIdAndUpdate(
        id,
        {
          isBlocked: false,
        },
        {
          new: true,
        }
      );
      res.json({
        message: "User UnBlocked",
      });
    } catch (error) {
      throw new Error(error);
    }
});

//change password
const updatePassword = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { password } = req.body;
  validateMongoDbId(_id);
  const user = await User.findById(_id);
  if (password) {
    const { error } = passwordSchema.validate(password);
    if (error) {
      res.json({
        message: error.details[0].message,
      });
      return;
    }
    user.password = password;
    const updatedPassword = await user.save();
    res.json({
      message: 'Password updated successfully',
      success: true,
      data: updatedPassword,
    });
  } else {
    res.json(user);
  }
});

//forgot password
const forgotPasswordToken = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) throw new Error("User not found with this email");
  try {
    const token = await user.createPasswordResetToken();
    await user.save();
    const resetURL = `Hi, click this link to reset Your Password. This link is valid till 10 minutes from now. <a href='http://localhost:5000/user/reset-password/${token}'>Click Here</>`;
    const data = {
      to: email,
      text: "Hi there!",
      subject: "Forgot Password Link",
      htm: resetURL,
    };
    sendEmail(data);
    res.json(token);
  } catch (error) {
    throw new Error(error);
  }
})


//reset password
const resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const { token } = req.params;
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  if (!user) throw new Error(" Token Expired, Please try again later");

  // Validate the new password
  const { error } = passwordSchema.validate(password);
  if (error) throw new Error(error.details[0].message);

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // Send success message
  res.json({
    success: true,
    message: "Password reset successful. Please login with your new password.",
  });
});


module.exports = {createUser, loginUserCtrl,getallUser, getSingleUser, deleteSingleUser, updatedUser,
  blockUser, unblockUser, handleRefreshToken, logout, updatePassword, forgotPasswordToken, resetPassword
};