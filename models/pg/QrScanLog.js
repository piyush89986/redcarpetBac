const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

/**
 * PostgreSQL Model: QrScanLog
 * Captures footfall, impressions, and scanner telemetry.
 */
const QrScanLog = sequelize.define(
  "QrScanLog",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    shopId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    mallId: {
      type: DataTypes.STRING,
      defaultValue: "",
    },
    shopName: {
      type: DataTypes.STRING,
      defaultValue: "General Location",
    },
    mallName: {
      type: DataTypes.STRING,
      defaultValue: "Red Carpet Complex",
    },
    isStore: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    scanType: {
      type: DataTypes.ENUM("qr_scan", "page_view", "pass_request"),
      defaultValue: "qr_scan",
    },
    ip: {
      type: DataTypes.STRING,
      defaultValue: "",
    },
    userAgent: {
      type: DataTypes.TEXT,
      defaultValue: "",
    },
    scannedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "qr_scan_logs",
    timestamps: true,
    indexes: [
      { fields: ["shopId", "scannedAt"] },
      { fields: ["mallId", "scannedAt"] },
      { fields: ["scannedAt"] },
    ],
  }
);

module.exports = QrScanLog;

