/**
 * Central Database Models Registry
 * Re-routes all legacy models to PostgreSQL (Sequelize)
 */
const {
  Mall,
  Store,
  User,
  QueueToken,
  QrConfig,
  QrScanLog,
  TvDisplay,
  Countdown,
  sequelize,
} = require("./pg");

module.exports = {
  // Domain PostgreSQL Models
  Mall,
  Store,
  User,
  QueueToken,
  QrConfig,
  QrScanLog,
  TvDisplay,
  Countdown,
  sequelize,

  // Backward-compatibility aliases
  Shop: Mall,
  Food: Mall,
  PhoenixUser: QueueToken,
  Data: QueueToken,
  DisplayModel: TvDisplay,
  ShopUser: User,
};
