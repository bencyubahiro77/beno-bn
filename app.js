const express = require("express");
const bodyParser = require("body-parser");
const app =express();
const dotenv = require("dotenv").config();
const dbConnect = require("./config/dbConnect");
const { notFound, errorHandler } = require("./middlewares/errorHandler");
const PORT = process.env.PORT || 5000;

const authRouter = require("./routes/authRoute");
const productRouter = require("./routes/productRoute");
const blogRouter = require("./routes/blogRoute");
const pCategoryRouter = require("./routes/prodcategoryRoute")
const blogCategoryRouter = require("./routes/blogCategoryRoute")
const brandRouter = require("./routes/brandRoute");

const cookieParser = require("cookie-parser");
const morgan = require("morgan");

dbConnect();

app.use(morgan("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser())


app.use("/user", authRouter);
app.use("/product", productRouter);
app.use("/blog", blogRouter);
app.use("/pcategory", pCategoryRouter);
app.use("/bcategory", blogCategoryRouter);
app.use("/brand", brandRouter);


app.use(notFound);
app.use(errorHandler);
app.listen(PORT, () => {
    console.log(`server is running on PORT ${PORT}`)
}); 