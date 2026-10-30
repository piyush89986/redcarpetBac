const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

/**
 * PostgreSQL Model: Store
 * Represents individual retail stores / counters inside a shopping mall complex.
 */
const Store = sequelize.define(
  "Store",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    mallId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "malls",
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    name: {
      type: DataTypes.STRING,
      defaultValue: "Store",
    },
    category: {
      type: DataTypes.STRING,
      defaultValue: "Retail Store",
    },
    image: {
      type: DataTypes.TEXT,
      defaultValue: "",
    },
    description: {
      type: DataTypes.TEXT,
      defaultValue: "",
    },
    link: {
      type: DataTypes.TEXT,
      defaultValue: "",
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isEmail: true,
      },
      set(val) {
        if (val) this.setDataValue("email", val.trim().toLowerCase());
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    role: {
      type: DataTypes.STRING,
      defaultValue: "shop admin",
    },
    shopconpassword: {
      type: DataTypes.STRING,
      defaultValue: "",
    },
    conciergeFee: {
      type: DataTypes.FLOAT,
      defaultValue: 120,
    },
    qrCodeUrl: {
      type: DataTypes.TEXT,
      defaultValue: "",
    },
    qrCodeSize: {
      type: DataTypes.INTEGER,
      defaultValue: 240,
    },
    subscriptionStatus: {
      type: DataTypes.ENUM("active", "inactive"),
      defaultValue: "active",
    },
  },
  {
    tableName: "stores",
    timestamps: true,
    indexes: [
      { fields: ["mallId"] },
      { fields: ["email"] },
      { fields: ["subscriptionStatus"] },
    ],
  }
);

module.exports = Store;

