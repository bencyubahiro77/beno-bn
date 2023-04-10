const express = require("express");
const {createUser, loginUserCtrl, getallUser, getSingleUser, deleteSingleUser, updatedUser,
    blockUser, unblockUser, handleRefreshToken, logout, updatePassword, forgotPasswordToken, resetPassword
} = require("../controllers/userCtrl")
const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/register", createUser)
router.post("/forgot-pass", forgotPasswordToken)
router.put("/reset-password/:token", resetPassword)
router.put('/change-pass', authMiddleware, updatePassword)

router.post("/login", loginUserCtrl)
router.get("/all-users",authMiddleware, isAdmin,getallUser)
router.get("/refresh", handleRefreshToken);
router.get("/logout", logout);
router.get("/:id", authMiddleware, isAdmin, getSingleUser)
router.delete("/:id", authMiddleware,isAdmin, deleteSingleUser)
router.put("/edit-user", authMiddleware, updatedUser)
router.put("/block-user/:id", authMiddleware, isAdmin, blockUser);
router.put("/unblock-user/:id", authMiddleware, isAdmin, unblockUser);


module.exports = router;  