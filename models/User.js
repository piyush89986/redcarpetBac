const mongoose = require("mongoose");

/**
 * System User / Account Schema
 * For platform authentication: SuperAdmin, Mall Executives, and Store Counter Operators.
 */
const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: "User",
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      default: "admin",
      index: true,
    },
    shopId: {
      type: String,
      default: null,
      index: true,
    },
    mallId: {
      type: String,
      default: null,
      index: true,
    },
    phone: {
      type: String,
      default: "",
    },
    avatar: {
      type: String,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: "users",
  }
);

const User = mongoose.models.User || mongoose.model("User", UserSchema);
module.exports = User;