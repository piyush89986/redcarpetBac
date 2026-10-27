const mongoose = require("mongoose");

const ShopSchema = new mongoose.Schema({
  title: String,
  description: String,
  image: String,
  email: String,
  password: String,
  role: String,
  mallconpassword: String,
  qrCodeUrl: String,
  qrCodeSize: Number,
  subscriptionStatus: {
    type: String,
    enum: ["active", "inactive"],
    default: "active",
  },
  menuItems: [
    {
      name: String,
      image: String,
      description: String,
      link: String,
      email: String,
      password: String,
      role: String,
      shopconpassword: String,
      qrCodeUrl: String,
      qrCodeSize: Number,
      subscriptionStatus: {
        type: String,
        enum: ["active", "inactive"],
        default: "active",
      },
    },
  ],
});

module.exports = mongoose.model("Food", ShopSchema);
