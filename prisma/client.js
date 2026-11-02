const { PrismaClient } = require("@prisma/client");

// Configure Prisma Client with connection pooling parameters suitable for serverless / Neon pooler
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

module.exports = prisma;
