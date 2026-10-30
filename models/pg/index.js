const sequelize = require("../../config/database");
const Mall = require("./Mall");
const Store = require("./Store");
const User = require("./User");
const QueueToken = require("./QueueToken");
const QrConfig = require("./QrConfig");
const QrScanLog = require("./QrScanLog");
const TvDisplay = require("./TvDisplay");
const Countdown = require("./Countdown");

// Relationships
Mall.hasMany(Store, {
  foreignKey: "mallId",
  as: "menuItems",
  onDelete: "CASCADE",
});

Store.belongsTo(Mall, {
  foreignKey: "mallId",
  as: "mall",
});

module.exports = {
  sequelize,
  Mall,
  Store,
  User,
  QueueToken,
  QrConfig,
  QrScanLog,
  TvDisplay,
  Countdown,
};

