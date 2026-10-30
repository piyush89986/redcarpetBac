const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

/**
 * PostgreSQL Model: User
 * Represents administrative, mall manager, and store counter operator accounts.
 */
const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      defaultValue: "User",
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
      set(val) {
        if (val) this.setDataValue("email", val.trim().toLowerCase());
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.STRING,
      defaultValue: "admin",
    },
    shopId: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    mallId: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    phone: {
      type: DataTypes.STRING,
      defaultValue: "",
    },
    avatar: {
      type: DataTypes.TEXT,
      defaultValue: "",
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: "users",
    timestamps: true,
    indexes: [
      { fields: ["email"], unique: true },
      { fields: ["role"] },
      { fields: ["shopId"] },
      { fields: ["mallId"] },
    ],
  }
);

module.exports = User;

