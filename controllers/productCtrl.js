const Product = require("../models/productModel");
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
     console.log(page, limit, skip)
     const product = await query;
      res.json(product);
      } catch (error) {
       throw new Error(error);
    }
});

module.exports = { createProduct, getaProduct, getAllProduct, updateProduct, deleteProduct
                   
};