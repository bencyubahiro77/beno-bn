const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors"); // Add this line
const app = express();
const dotenv = require("dotenv").config();
const dbConnect = require("./config/dbConnect");
const { notFound, errorHandler } = require("./middlewares/errorHandler");
const PORT = process.env.PORT || 5000;

const cloudinary = require("cloudinary").v2;
const multer = require("multer");

dbConnect();

app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(cors()); // Add this line

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Middleware to handle form-data
app.use(upload.single("image"));

app.post("/upload", async (req, res) => {
  try {
    const result = await cloudinary.uploader.upload(req.file.path);
    res.status(200).json({ imageUrl: result.secure_url });
  } catch (err) {
    res.status(500).json({ error: "Image upload failed" });
  }
});

const authRouter = require("./routes/authRoute");
const blogRoute = require("./routes/blog");

app.use("/user", authRouter);
app.use("/blog", blogRoute);

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on PORT ${PORT}`);
});
