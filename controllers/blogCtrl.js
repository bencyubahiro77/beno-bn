const Blog = require("../models/blogModel");
const User = require("../models/userModel");
const asyncHandler = require("express-async-handler");
const validateMongoDbId = require("../utils/validateMongodbId");

//create a blog
const createBlog = asyncHandler(async (req, res) => {
    try {
      const newBlog = await Blog.create(req.body);
      res.json({
        message:" new Blog created successfully",
        newBlog});
    } catch (error) {
      throw new Error(error);
    }
});

//update a blog
const updateBlog = asyncHandler(async (req, res) => {
    const { id } = req.params;
    validateMongoDbId(id);
    try {
      const updateBlog = await Blog.findByIdAndUpdate(id, req.body, {
        new: true,
      });
      res.json({
        message:" Blog updated successfully",
        updateBlog});
    } catch (error) {
      throw new Error(error);
    }
});

// get a blog
const getBlog = asyncHandler(async (req, res) => {
    const { id } = req.params;
    validateMongoDbId(id);
    try {
    const getBlog = await Blog.findById(id)
    .populate("likes")
    .populate("dislikes");
    if (!getBlog) {
    return res.status(404).json({ message: "Blog not found" });
    }
    const updateViews = await Blog.findByIdAndUpdate(
    id,
    {
    $inc: { numViews: 1 },
    },
    { new: true }
    );
    res.json(getBlog);
    } catch (error) {
    throw new Error(error);
    }
});

//get all blogs
const getAllBlogs = asyncHandler(async (req, res) => {
    try {
      const getBlogs = await Blog.find();
      res.json(getBlogs);
    } catch (error) {
      throw new Error(error);
    }
});

//delete a blog
const deleteBlog = asyncHandler(async (req, res) => {
    const { id } = req.params;
    validateMongoDbId(id);
    try {
      const deletedBlog = await Blog.findByIdAndDelete(id);
      res.json({ message:" Blog deleted successfully",});
    } catch (error) {
      throw new Error(error);
    }
});

//like a blog
const liketheBlog = asyncHandler(async (req, res) => {
    const { blogId } = req.body;
    validateMongoDbId(blogId);
    // Find the blog which you want to like
    const blog = await Blog.findById(blogId);
    // find the login user
    const loginUserId = req?.user?._id;
    // find if the user has liked the blog
    const isLiked = blog?.isLiked;
    // find if the user has disliked the blog
    const alreadyDisliked = blog?.dislikes?.find(
      (userId) => userId?.toString() === loginUserId?.toString()
    );
    if (alreadyDisliked) {
      const blog = await Blog.findByIdAndUpdate(
        blogId,
        {
          $pull: { dislikes: loginUserId },
          isDisliked: false,
        },
        { new: true }
      );
      res.json(blog);
    }
    if (isLiked) {
      const blog = await Blog.findByIdAndUpdate(
        blogId,
        {
          $pull: { likes: loginUserId },
          isLiked: false,
        },
        { new: true }
      );
      res.json(blog);
    } else {
      const blog = await Blog.findByIdAndUpdate(
        blogId,
        {
          $push: { likes: loginUserId },
          isLiked: true,
        },
        { new: true }
      );
      res.json({ message:" Blog liked successfully", blog});
    }
});

//dislike the blog
const disliketheBlog = asyncHandler(async (req, res) => {
    const { blogId } = req.body;
    validateMongoDbId(blogId);
    // Find the blog which you want to be liked
    const blog = await Blog.findById(blogId);
    // find the login user
    const loginUserId = req?.user?._id;
    // find if the user has liked the blog
    const isDisLiked = blog?.isDisliked;
    // find if the user has disliked the blog
    const alreadyLiked = blog?.likes?.find(
      (userId) => userId?.toString() === loginUserId?.toString()
    );
    if (alreadyLiked) {
      const blog = await Blog.findByIdAndUpdate(
        blogId,
        {
          $pull: { likes: loginUserId },
          isLiked: false,
        },
        { new: true }
      );
      res.json(blog);
    }
    if (isDisLiked) {
      const blog = await Blog.findByIdAndUpdate(
        blogId,
        {
          $pull: { dislikes: loginUserId },
          isDisliked: false,
        },
        { new: true }
      );
      res.json(blog);
    } else {
      const blog = await Blog.findByIdAndUpdate(
        blogId,
        {
          $push: { dislikes: loginUserId },
          isDisliked: true,
        },
        { new: true }
      );
      res.json({ message:" Blog disliked successfully", blog});
    }
});
  

module.exports = {
    createBlog,
    updateBlog,
    getBlog,
    getAllBlogs,
    deleteBlog,
    liketheBlog,
    disliketheBlog,
    // uploadImages,
};