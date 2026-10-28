const mongoose = require("mongoose");

/**
 * Queue Token / Customer Digital Pass Schema
 * Represents a live queue token issued to a customer visiting a store/mall.
 */
const QueueTokenSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    mobile: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    email: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },
    shopid: {
      type: String,
      required: true,
      index: true,
    },
    mallId: {
      type: String,
      default: "",
      index: true,
    },
    status: {
      type: String,
      enum: ["waiting", "called", "served", "cancelled"],
      default: "waiting",
      index: true,
    },
    calledAt: {
      type: Date,
      default: null,
    },
    servedAt: {
      type: Date,
      default: null,
    },
    serviceDurationSeconds: {
      type: Number,
      default: 180,
    },
    clicked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: "phoenixusers", // Bound to existing collection in MongoDB Atlas
  }
);

// Compound indexes for fast real-time queue lookup
QueueTokenSchema.index({ shopid: 1, createdAt: -1 });
QueueTokenSchema.index({ shopid: 1, status: 1 });
QueueTokenSchema.index({ mobile: 1, createdAt: -1 });

const QueueToken =
  mongoose.models.QueueToken ||
  mongoose.model("QueueToken", QueueTokenSchema);

module.exports = QueueToken;
