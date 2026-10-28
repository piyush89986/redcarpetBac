const mongoose = require("mongoose");

/**
 * Store Item Sub-Schema
 * Represents a brand / retail counter inside a shopping mall complex.
 */
const StoreItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: "Store",
      trim: true,
    },
    category: {
      type: String,
      default: "Retail Store",
      trim: true,
    },
    image: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      default: "",
    },
    link: {
      type: String,
      default: "",
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
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
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Mall / Complex Schema
 * Represents a premium shopping mall / commercial center.
 */
const MallSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
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
    },
    mallconpassword: {
      type: String,
      default: "",
    },
    city: {
      type: String,
      default: "",
    },
    address: {
      type: String,
      default: "",
    },
    contactPhone: {
      type: String,
      default: "",
    },
    subscriptionStatus: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    qrCodeUrl: {
      type: String,
      default: "",
    },
    qrCodeSize: {
      type: Number,
      default: 240,
    },
    // Stores / Retail outlets located within this complex
    menuItems: [StoreItemSchema],
  },
  {
    timestamps: true,
    collection: "malls",
  }
);

// Indexes for fast lookup
MallSchema.index({ email: 1 });
MallSchema.index({ "menuItems.email": 1 });
MallSchema.index({ subscriptionStatus: 1 });

const Mall = mongoose.models.Mall || mongoose.model("Mall", MallSchema);
module.exports = Mall;
