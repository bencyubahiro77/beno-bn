const User = require("../models/userModel");
const Product = require("../models/productModel");
const Cart = require("../models/cartModel");
const Order = require("../models/orderModel");
const Coupon = require("../models/couponModel");
const uniqid = require("uniqid");

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

// admin login
const loginAdmin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  // check if user exists or not
  const findAdmin = await User.findOne({ email });
  if (findAdmin.role !== "admin") throw new Error("Access denied");
  if (findAdmin && (await findAdmin.isPasswordMatched(password))) {
    const refreshToken = await generateRefreshToken(findAdmin?._id);
    const updateuser = await User.findByIdAndUpdate(
      findAdmin.id,
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
      _id: findAdmin?._id,
      email: findAdmin?.email,
      token: generateToken(findAdmin?._id),
    });
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

// save user Address
const saveAddress = asyncHandler(async (req, res, next) => {
  const { _id } = req.user;
  validateMongoDbId(_id);
  try {
    const updatedUser = await User.findByIdAndUpdate(
      _id,
      {
        address: req?.body?.address,
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
  res.json({
    success: true,
    message: "Password reset successful. Please login with your new password.",
  });
});


//get wishlist
const getWishlist = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  try {
    const findUser = await User.findById(_id).populate("wishlist");
    res.json(findUser);
  } catch (error) {
    throw new Error(error);
  }
});

//create a cart
const userCart = asyncHandler(async (req, res) => {
  const { cart } = req.body;
  const { _id } = req.user;
  validateMongoDbId(_id);
  try {
    let products = [];
    const user = await User.findById(_id);
    // check if user already have product in cart
    const alreadyExistCart = await Cart.findOne({ orderby: user._id });
    if (alreadyExistCart) {
      alreadyExistCart.remove();
    }
    for (let i = 0; i < cart.length; i++) {
      let object = {};
      object.product = cart[i]._id;
      object.count = cart[i].count;
      object.color = cart[i].color;
      let getPrice = await Product.findById(cart[i]._id).select("price").exec();
      object.price = getPrice.price;
      products.push(object);
    }
    let cartTotal = 0;
    for (let i = 0; i < products.length; i++) {
      cartTotal = cartTotal + products[i].price * products[i].count;
    }
    let newCart = await new Cart({
      products,
      cartTotal,
      orderby: user?._id,
    }).save();
    res.json(newCart);
  } catch (error) {
    throw new Error(error);
  }
});

//get user cart
const getUserCart = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  validateMongoDbId(_id);
  try {
    const cart = await Cart.findOne({ orderby: _id }).populate(
      "products.product"
    );
    res.json(cart);
  } catch (error) {
    throw new Error(error);
  }
});

//empty the cart
const emptyCart = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  validateMongoDbId(_id);
  try {
    const user = await User.findOne({ _id });
    const cart = await Cart.findOneAndRemove({ orderby: user._id });
    res.json(cart);
  } catch (error) {
    throw new Error(error);
  }
});

//apply coupon
const applyCoupon = asyncHandler(async (req, res) => {
  const { coupon } = req.body;
  const { _id } = req.user;
  validateMongoDbId(_id);
  const validCoupon = await Coupon.findOne({ name: coupon });
  if (validCoupon === null) {
    throw new Error("Invalid Coupon");
  }
  const user = await User.findOne({ _id });
  let { cartTotal } = await Cart.findOne({
    orderby: user._id,
  }).populate("products.product");
  let totalAfterDiscount = (
    cartTotal -
    (cartTotal * validCoupon.discount) / 100
  ).toFixed(2);
  await Cart.findOneAndUpdate(
    { orderby: user._id },
    { totalAfterDiscount },
    { new: true }
  );
  res.json(totalAfterDiscount);
});

//creating an order
const createOrder = asyncHandler(async (req, res) => {
  const { COD, couponApplied } = req.body;
  const { _id } = req.user;
  validateMongoDbId(_id);
  try {
    if (!COD) throw new Error("Create cash order failed");
    const user = await User.findById(_id);
    let userCart = await Cart.findOne({ orderby: user._id });
    let finalAmout = 0;
    if (couponApplied && userCart.totalAfterDiscount) {
      finalAmout = userCart.totalAfterDiscount;
    } else {
      finalAmout = userCart.cartTotal;
    }

    let newOrder = await new Order({
      products: userCart.products,
      paymentIntent: {
        id: uniqid(),
        method: "COD",
        amount: finalAmout,
        status: "Cash on Delivery",
        created: Date.now(),
        currency: "RWF",
      },
      orderby: user._id,
      orderStatus: "Cash on Delivery",
    }).save();
    let update = userCart.products.map((item) => {
      return {
        updateOne: {
          filter: { _id: item.product._id },
          update: { $inc: { quantity: -item.count, sold: +item.count } },
        },
      };
    });
    const updated = await Product.bulkWrite(update, {});
    res.json({ message: "success" });
  } catch (error) {
    throw new Error(error);
  }
});


//getting an order
const getOrders = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  validateMongoDbId(_id);
  try {
    const userorders = await Order.findOne({ orderby: _id })
      .populate("products.product")
      .populate("orderby")
      .exec();
    res.json(userorders);
  } catch (error) {
    throw new Error(error);
  }
});

//getting all orders
const getAllOrders = asyncHandler(async (req, res) => {
  try {
    const alluserorders = await Order.find()
      .populate("products.product")
      .populate("orderby")
      .exec();
    res.json(alluserorders);
  } catch (error) {
    throw new Error(error);
  }
});

//getting single order
const getOrderByUserId = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);
  try {
    const userorders = await Order.findOne({ orderby: id })
      .populate("products.product")
      .populate("orderby")
      .exec();
    res.json(userorders);
  } catch (error) {
    throw new Error(error);
  }
});

//updating an order
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const { id } = req.params;
  validateMongoDbId(id);
  try {
    const updateOrderStatus = await Order.findByIdAndUpdate(
      id,
      {
        orderStatus: status,
        paymentIntent: {
          status: status,
        },
      },
      { new: true }
    );
    res.json(updateOrderStatus);
  } catch (error) {
    throw new Error(error);
  }
});


module.exports = {createUser, loginUserCtrl,getallUser, getSingleUser, deleteSingleUser, updatedUser,
  blockUser, unblockUser, handleRefreshToken, logout, updatePassword, forgotPasswordToken, resetPassword,
  loginAdmin, getWishlist, saveAddress, userCart ,getUserCart, emptyCart, applyCoupon , createOrder,
  getOrders, getAllOrders, getOrderByUserId, updateOrderStatus
}; 