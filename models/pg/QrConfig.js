const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

/**
 * PostgreSQL Model: QrConfig
 * Stores destination URL and dimensions for standees and counters.
 */
const QrConfig = sequelize.define(
  "QrConfig",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    shopId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    qrUrl: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    size: {
      type: DataTypes.INTEGER,
      defaultValue: 240,
    },
  },
  {
    tableName: "qr_configs",
    timestamps: true,
    indexes: [
      { fields: ["shopId"], unique: true },
    ],
  }
);

module.exports = QrConfig;

