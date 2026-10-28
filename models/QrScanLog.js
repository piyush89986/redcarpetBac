const mongoose = require("mongoose");

const qrScanLogSchema = new mongoose.Schema(
  {
    shopId: {
      type: String,
      required: true,
      index: true,
    },
    mallId: {
      type: String,
      index: true,
      default: "",
    },
    shopName: {
      type: String,
      default: "General Location",
    },
    mallName: {
      type: String,
      default: "Red Carpet Complex",
    },
    isStore: {
      type: Boolean,
      default: false,
    },
    scanType: {
      type: String,
      enum: ["qr_scan", "page_view", "pass_request"],
      default: "qr_scan",
    },
    ip: {
      type: String,
      default: "",
    },
    userAgent: {
      type: String,
      default: "",
    },
    scannedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast aggregation by location and date
qrScanLogSchema.index({ shopId: 1, scannedAt: -1 });
qrScanLogSchema.index({ mallId: 1, scannedAt: -1 });
qrScanLogSchema.index({ scannedAt: -1 });

module.exports = mongoose.model("QrScanLog", qrScanLogSchema);
