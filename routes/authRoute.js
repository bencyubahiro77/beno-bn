const express = require("express");
const {createUser, loginUserCtrl, getallUser, getSingleUser, deleteSingleUser, updatedUser,
    blockUser, unblockUser, handleRefreshToken, logout, updatePassword, forgotPasswordToken, resetPassword,
    loginAdmin, getWishlist, saveAddress, userCart, getUserCart, emptyCart, 
    applyCoupon, createOrder, getOrders, getAllOrders, updateOrderStatus
} = require("../controllers/userCtrl")
const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/register", createUser)
router.post("/forgot-pass", forgotPasswordToken)
router.put("/reset-password/:token", resetPassword)
router.put('/change-pass', authMiddleware, updatePassword)

router.post("/login", loginUserCtrl)
router.post("/admin-login", loginAdmin);
router.post("/cart", authMiddleware, userCart);
router.post("/cart/applycoupon", authMiddleware, applyCoupon);

router.post("/cart/cash-order", authMiddleware, createOrder);
router.get("/all-users",authMiddleware, isAdmin,getallUser)
router.get("/get-orders", authMiddleware, getOrders);
router.get("/getallorders", authMiddleware, isAdmin, getAllOrders);
router.post("/getorderbyuser/:id", authMiddleware, isAdmin, getAllOrders);

router.get("/refresh", handleRefreshToken);
router.get("/logout", logout);
router.get("/wishlist", authMiddleware, getWishlist);
router.get("/cart", authMiddleware, getUserCart);

router.get("/:id", authMiddleware, isAdmin, getSingleUser)
router.delete("/empty-cart", authMiddleware, emptyCart);
router.delete("/:id", authMiddleware,isAdmin, deleteSingleUser)
router.put("/order/update-order/:id", authMiddleware, isAdmin, updateOrderStatus);

router.put("/edit-user", authMiddleware, updatedUser)
router.put("/save-address", authMiddleware, saveAddress);
router.put("/block-user/:id", authMiddleware, isAdmin, blockUser);
router.put("/unblock-user/:id", authMiddleware, isAdmin, unblockUser);


module.exports = router;  