const mongoose = require("mongoose");

const qrConfigSchema = new mongoose.Schema({
  shopId: { type: String, required: true, unique: true },
  qrUrl: { type: String, required: true },
  size: { type: Number, default: 240 },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("QrConfig", qrConfigSchema);
