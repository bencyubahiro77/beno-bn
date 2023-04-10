const Product = require("../models/productModel");
const User = require("../models/userModel");
const asyncHandler = require("express-async-handler");
const slugify = require("slugify");
const validateMongoDbId = require("../utils/validateMongodbId");

// create a product
const createProduct = asyncHandler(async (req, res) => {
    try {
      if (req.body.title) {
        req.body.slug = slugify(req.body.title);
      }
      const newProduct = await Product.create(req.body);
      res.json(newProduct);
    } catch (error) {
      throw new Error(error);
    }
});

// update a product
const updateProduct = asyncHandler(async (req, res) => {
    const id = req.params.id;
    try {
      if (req.body.title) {
        req.body.slug = slugify(req.body.title);
      }
      const updatedProduct = await Product.findOneAndUpdate({ _id: id }, req.body, {
        new: true,
      });
      res.json({
        message: "Product updated successfully",
        updatedProduct,
      });
    } catch (error) {
      throw new Error(error);
    }
});

//delete a product
const deleteProduct = asyncHandler(async (req, res) => {
    const id = req.params.id;
    try {
      const deletedProduct = await Product.findOneAndDelete({ _id: id });
      res.json({
        message: "Product deleted successfully",
        deletedProduct,
      });
    } catch (error) {
      throw new Error(error);
    }
});


//get a single product
const getaProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;
    validateMongoDbId(id);
    try {
      const findProduct = await Product.findById(id);
      res.json(findProduct);
    } catch (error) {
      throw new Error(error);
    }
});

//get all product
const getAllProduct = asyncHandler(async (req, res) => {
    try {
     // Filtering
     const queryObj = { ...req.query };
     const excludeFields = ["page", "sort", "limit", "fields"];
     excludeFields.forEach((el) => delete queryObj[el]);
     console.log(queryObj);
     let queryStr = JSON.stringify(queryObj);
     queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

     let query = Product.find(JSON.parse(queryStr));

     // Sorting
     if (req.query.sort) {
        const sortBy = req.query.sort.split(",").join(" ");
        query = query.sort(sortBy);
      } else {
        query = query.sort("-createdAt");
      }
       
     // limiting the fields
     if (req.query.fields) {
        const fields = req.query.fields.split(",").join(" ");
        query = query.select(fields);
      } else {
        query = query.select("-__v");
      }
     
      // pagination

      const page = req.query.page;
      const limit = req.query.limit;
      const skip = (page - 1) * limit;
      query = query.skip(skip).limit(limit);
      if (req.query.page) {
      const productCount = await Product.countDocuments();
      if (skip >= productCount) throw new Error("This Page is not found");
      }
     const product = await query;
      res.json(product);
      } catch (error) {
       throw new Error(error);
    }
});

//wishlist adding product and again add that product to remove it
const addToWishlist = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    const { prodId } = req.body;
    try {
      const user = await User.findById(_id);
      const alreadyadded = user.wishlist.find((id) => id.toString() === prodId);
      if (alreadyadded) {
        let user = await User.findByIdAndUpdate(
          _id,
          {
            $pull: { wishlist: prodId },
          },
          {
            new: true,
          }
        );
        res.json(user);
      } else {
        let user = await User.findByIdAndUpdate(
          _id,
          {
            $push: { wishlist: prodId },
          },
          {
            new: true,
          }
        );
        res.json(user);
      }
    } catch (error) {
      throw new Error(error);
    }
})

// clear the wishlist
const clearWishlist = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  try {
    const user = await User.findByIdAndUpdate(
      _id,
      {
        $set: { wishlist: [] },
      },
      {
        new: true,
      }
    );
    res.json({ success: true, message: 'Wishlist cleared' })
  } catch (error) {
    throw new Error(error);
  }
});


//ratings

const rating = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    const { star, prodId, comment } = req.body;
    try {
      const product = await Product.findById(prodId);
      let alreadyRated = product.ratings.find(
        (userId) => userId.postedby.toString() === _id.toString()
      );
      if (alreadyRated) {
        const updateRating = await Product.updateOne(
          {
            ratings: { $elemMatch: alreadyRated },
          },
          {
            $set: { "ratings.$.star": star, "ratings.$.comment": comment },
          },
          {
            new: true,
          }
        );
      } else {
        const rateProduct = await Product.findByIdAndUpdate(
          prodId,
          {
            $push: {
              ratings: {
                star: star,
                comment: comment,
                postedby: _id,
              },
            },
          },
          {
            new: true,
          }
        );
      }
      const getallratings = await Product.findById(prodId);
      let totalRating = getallratings.ratings.length;
      let ratingsum = getallratings.ratings
        .map((item) => item.star)
        .reduce((prev, curr) => prev + curr, 0);
      let actualRating = Math.round(ratingsum / totalRating);
      let finalproduct = await Product.findByIdAndUpdate(
        prodId,
        {
          totalrating: actualRating,
        },
        { new: true }
      );
      res.json(finalproduct);
    } catch (error) {
      throw new Error(error);
    }
});

module.exports = { createProduct, getaProduct, getAllProduct, updateProduct, deleteProduct, 
addToWishlist, clearWishlist, rating,      
};