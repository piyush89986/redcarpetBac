const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

/**
 * PostgreSQL Model: Countdown
 * Handles active timers and token announcements for live TV screens.
 */
const Countdown = sequelize.define(
  "Countdown",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    startTime: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    duration: {
      type: DataTypes.INTEGER,
      defaultValue: 180,
    },
    shopId: {
      type: DataTypes.STRING,
      defaultValue: "",
    },
    token: {
      type: DataTypes.STRING,
      defaultValue: "",
    },
    name: {
      type: DataTypes.STRING,
      defaultValue: "Valued Guest",
    },
    storeName: {
      type: DataTypes.STRING,
      defaultValue: "",
    },
    mallTitle: {
      type: DataTypes.STRING,
      defaultValue: "",
    },
  },
  {
    tableName: "countdowns",
    timestamps: true,
    indexes: [
      { fields: ["shopId"] },
      { fields: ["createdAt"] },
    ],
  }
);

module.exports = Countdown;

