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

  sequelize = new Sequelize(connectionString, {
    dialect: "postgres",
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
      max: 15,
      min: 0,
      acquire: 30000,
      idle: 10000,
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
        max: 15,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
    }
  );
}

module.exports = sequelize;

