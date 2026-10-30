const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

/**
 * PostgreSQL Model: Mall
 * Represents shopping mall complexes / centers.
 */
const Mall = sequelize.define(
  "Mall",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      defaultValue: "",
    },
    image: {
      type: DataTypes.TEXT,
      defaultValue: "",
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
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
    mallconpassword: {
      type: DataTypes.STRING,
      defaultValue: "",
    },
    city: {
      type: DataTypes.STRING,
      defaultValue: "",
    },
    address: {
      type: DataTypes.TEXT,
      defaultValue: "",
    },
    contactPhone: {
      type: DataTypes.STRING,
      defaultValue: "",
    },
    subscriptionStatus: {
      type: DataTypes.ENUM("active", "inactive"),
      defaultValue: "active",
    },
    qrCodeUrl: {
      type: DataTypes.TEXT,
      defaultValue: "",
    },
    qrCodeSize: {
      type: DataTypes.INTEGER,
      defaultValue: 240,
    },
    plan: {
      type: DataTypes.JSONB,
      defaultValue: {
        name: "Standard Plan",
        tier: "starter",
        maxStores: 25,
        status: "active",
        expiresAt: null,
      },
    },
  },
  {
    tableName: "malls",
    timestamps: true,
    indexes: [
      { fields: ["email"] },
      { fields: ["subscriptionStatus"] },
    ],
  }
);

module.exports = Mall;

