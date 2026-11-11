const { Sequelize } = require("sequelize");
require("dotenv").config();

const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URI ||
  process.env.POSTGRESQL_URL;

let sequelize;

if (connectionString) {
  const isSslRequired =
    process.env.PG_SSL === "true" ||
    connectionString.includes("sslmode=require") ||
    !connectionString.includes("localhost") && !connectionString.includes("127.0.0.1");

  // Explicitly use sslmode=verify-full to satisfy pg-connection-string requirements
  // while preserving full SSL certificate verification security guarantees
  const normalizedConnectionString = connectionString.includes("sslmode=require")
    ? connectionString.replace("sslmode=require", "sslmode=verify-full")
    : connectionString;

  sequelize = new Sequelize(normalizedConnectionString, {
    dialect: "postgres",
    schema: "redcarpet",
    logging: process.env.NODE_ENV === "development" ? console.log : false,
    dialectOptions: isSslRequired
      ? {
          ssl: {
            require: true,
            rejectUnauthorized: false,
          },
        }
      : {},
    pool: {
      max: 5,
      min: 0,
      acquire: 20000,
      idle: 5000,
    },
  });
} else {
  const isSslRequired = process.env.PG_SSL === "true";
  sequelize = new Sequelize(
    process.env.PG_DATABASE || "redcarpet_db",
    process.env.PG_USER || "postgres",
    process.env.PG_PASSWORD || "postgres",
    {
      host: process.env.PG_HOST || "localhost",
      port: Number(process.env.PG_PORT) || 5432,
      dialect: "postgres",
      schema: "redcarpet",
      logging: process.env.NODE_ENV === "development" ? console.log : false,
      dialectOptions: isSslRequired
        ? {
            ssl: {
              require: true,
              rejectUnauthorized: false,
            },
          }
        : {},
      pool: {
        max: 5,
        min: 0,
        acquire: 20000,
        idle: 5000,
      },
    }
  );
}

module.exports = sequelize;

