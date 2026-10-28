const mongoose = require("mongoose");

/**
 * Store / Brand Counter Schema
 * Dedicated model representing an individual retail store / counter.
 */
const StoreSchema = new mongoose.Schema(
  {
    mallId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Mall",
      index: true,
    },
    mallTitle: {
      type: String,
      default: "",
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      default: "Retail Fashion",
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    image: {
      type: String,
      default: "",
    },
    link: {
      type: String,
      default: "",
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    password: {
      type: String,
    },
    role: {
      type: String,
      default: "shop admin",
    },
    shopconpassword: {
      type: String,
      default: "",
    },
    conciergeFee: {
      type: Number,
      default: 120,
    },
    qrCodeUrl: {
      type: String,
      default: "",
    },
    qrCodeSize: {
      type: Number,
      default: 240,
    },
    subscriptionStatus: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

StoreSchema.index({ mallId: 1, name: 1 });

const Store = mongoose.models.Store || mongoose.model("Store", StoreSchema);
module.exports = Store;
