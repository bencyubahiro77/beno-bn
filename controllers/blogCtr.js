const User = require("../models/userModel");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const Post = require("../models/Post");

const createPost = async (req, res) => {
  try {
    const { title, desc, category } = req.body;
    const newPost = new Post({
      title,
      desc,
      category,
      fullname: req.user.fullname,
      ownerId: req.user._id,
    });

    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path);
      newPost.image = result.secure_url;

      // Remove the image file from the local folder
      fs.unlinkSync(req.file.path);
    }

    const savedPost = await newPost.save();
    res.status(200).json({
      message: "Blog created successfully",
      post: savedPost,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "An internal server error occurred" });
  }
};


const updatePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (post.ownerId.equals(req.user._id)) {
      try {
        let updatedPost = { ...req.body };
        if (req.file) {
          const result = await cloudinary.uploader.upload(req.file.path);
          updatedPost.image = result.secure_url;

          // Remove the previous image file from the local folder
          fs.unlinkSync(req.file.path);
        }
        updatedPost = await Post.findByIdAndUpdate(req.params.id, updatedPost, {
          new: true,
        });
        res.status(200).json(updatedPost);
      } catch (err) {
        res.status(500).json(err);
      }
    } else {
      res.status(401).json("You can update only your post!");
    }
  } catch (err) {
    res.status(500).json(err);
  }
};


const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (post.ownerId.toString() === req.user._id.toString()) {
      try {
        await Post.deleteOne({ _id: req.params.id });
        res.status(200).json("Post has been deleted");
      } catch (err) {
        res.status(500).json(err);
      }
    } else {
      res.status(401).json("You can delete only your post!");
    }
  } catch (err) {
    res.status(500).json(err);
  }
};

const getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    res.status(200).json(post);
  } catch (err) {
    res.status(500).json(err);
  }
};

const getAllPosts = async (req, res) => {
  const { fullname, category } = req.query;
  try {
    let posts;
    if (fullname && category) {
      posts = await Post.find({ fullname, category }).sort({ createdAt: -1 });
    } else if (fullname) {
      posts = await Post.find({ fullname }).sort({ createdAt: -1 });
    } else if (category) {
      posts = await Post.find({ category }).sort({ createdAt: -1 });
    } else {
      posts = await Post.find().sort({ createdAt: -1 });
    }
    res.status(200).json(posts);
  } catch (err) {
    res.status(500).json(err);
  }
};


module.exports = {
  createPost,
  updatePost,
  deletePost,
  getPost,
  getAllPosts,
};
