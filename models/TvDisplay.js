const mongoose = require("mongoose");

/**
 * TV Screen Display Customizer Schema
 * Controls the TV countdown screen and live service announcements in store/mall waiting areas.
 */
const TvDisplaySchema = new mongoose.Schema(
  {
    displayid: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    storeId: {
      type: String,
      default: "",
    },
    mallId: {
      type: String,
      default: "",
    },
    headline: {
      type: String,
      default: "NOW SERVING GUESTS",
    },
    subText: {
      type: String,
      default: "Please approach your designated billing counter",
    },
    royalPassText: {
      type: String,
      default: "Red Carpet VIP Experience",
    },
    backgroundImage: {
      type: String,
      default: "",
    },
    // Backward-compatible field aliases
    phoenixText: String,
    pText: String,
  },
  {
    timestamps: true,
    collection: "tvdisplays",
  }
);

const TvDisplay =
  mongoose.models.TvDisplay ||
  mongoose.model("TvDisplay", TvDisplaySchema);

module.exports = TvDisplay;
