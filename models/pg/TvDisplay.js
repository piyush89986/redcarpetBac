const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

/**
 * PostgreSQL Model: TvDisplay
 * Controls the TV digital signage, countdown screen, and queue callouts.
 */
const TvDisplay = sequelize.define(
  "TvDisplay",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    displayid: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    storeId: {
      type: DataTypes.STRING,
      defaultValue: "",
    },
    mallId: {
      type: DataTypes.STRING,
      defaultValue: "",
    },
    headline: {
      type: DataTypes.STRING,
      defaultValue: "NOW SERVING GUESTS",
    },
    subText: {
      type: DataTypes.STRING,
      defaultValue: "Please approach your designated billing counter",
    },
    royalPassText: {
      type: DataTypes.STRING,
      defaultValue: "Red Carpet VIP Experience",
    },
    backgroundImage: {
      type: DataTypes.TEXT,
      defaultValue: "",
    },
    phoenixText: {
      type: DataTypes.STRING,
      defaultValue: "",
    },
    pText: {
      type: DataTypes.STRING,
      defaultValue: "",
    },
  },
  {
    tableName: "tvdisplays",
    timestamps: true,
    indexes: [
      { fields: ["displayid"], unique: true },
    ],
  }
);

module.exports = TvDisplay;

