const express = require("express");
const {
  createPost,
  updatePost,
  deletePost,
  getPost,
  getAllPosts,
}= require("../controllers/blogCtr")

const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/", authMiddleware, isAdmin, createPost);
router.put("/:id", authMiddleware,isAdmin, updatePost);
router.delete("/:id", authMiddleware,isAdmin, deletePost);
router.get("/:id", getPost);
router.get("/", getAllPosts);




module.exports = router;  