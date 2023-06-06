const mongoose = require('mongoose'); 
const bcrypt = require("bcrypt");
const crypto = require("crypto")

var userSchema = new mongoose.Schema(
    {
      fullname: {
        type: String,
        required: true,
        max: 200
      },
      email: {
        type: String,
        required: true,
        unique: true,
        max:255
      },
      password: {
        type: String,
        required: true,
        max:1024,
        min:8
      },
      role: {
        type: String,
        default: "user",
      },
      isBlocked: {
        type: Boolean,
        default: false,
      },

      refreshToken: {
        type: String,
      },
      passwordChangedAt: Date,
      passwordResetToken: String,
      passwordResetExpires: Date,
    },
    {
      timestamps: true,
    }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
    const salt = await bcrypt.genSaltSync(10);
    this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.isPasswordMatched = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.createPasswordResetToken = async function () {
  const resettoken = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resettoken)
    .digest("hex");
  this.passwordResetExpires = Date.now() + 30 * 60 * 1000; // 10 minutes
  return resettoken;
};

//Export the model
module.exports = mongoose.model('User', userSchema);