const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

/**
 * PostgreSQL Model: QueueToken
 * Represents customer queue passes / tokens issued for shopping malls and retail stores.
 */
const QueueToken = sequelize.define(
  "QueueToken",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    token: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    mobile: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      defaultValue: "",
    },
    shopid: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    mallId: {
      type: DataTypes.STRING,
      defaultValue: "",
    },
    status: {
      type: DataTypes.ENUM("waiting", "called", "served", "cancelled"),
      defaultValue: "waiting",
    },
    calledAt: {
      type: DataTypes.DATE,
      defaultValue: null,
    },
    servedAt: {
      type: DataTypes.DATE,
      defaultValue: null,
    },
    serviceDurationSeconds: {
      type: DataTypes.INTEGER,
      defaultValue: 180,
    },
    clicked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: "queuetokens",
    timestamps: true,
    indexes: [
      { fields: ["shopid", "createdAt"] },
      { fields: ["shopid", "status"] },
      { fields: ["mobile"] },
      { fields: ["mallId"] },
    ],
  }
);

module.exports = QueueToken;

