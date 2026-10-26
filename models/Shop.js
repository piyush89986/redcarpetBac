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
    },
  ],
});

module.exports = mongoose.model("Food", ShopSchema);
