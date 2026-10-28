/**
 * Central Database Models Registry
 * Cleanly exports all distinct domain models by their functional purpose.
 */
const Mall = require("./Mall");
const Store = require("./Store");
const User = require("./User");
const QueueToken = require("./QueueToken");
const QrConfig = require("./QrConfig");
const QrScanLog = require("./QrScanLog");
const TvDisplay = require("./TvDisplay");

module.exports = {
  // Domain Schemas
  Mall,
  Store,
  User,
  QueueToken,
  QrConfig,
  QrScanLog,
  TvDisplay,

  // Backward-compatibility aliases
  Shop: Mall,
  Food: Mall,
  PhoenixUser: QueueToken,
  Data: QueueToken,
  DisplayModel: TvDisplay,
  ShopUser: User,
};
