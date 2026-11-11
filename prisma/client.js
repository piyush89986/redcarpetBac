const { PrismaClient } = require("@prisma/client");
require("dotenv").config();

/**
 * Normalizes Neon PostgreSQL connection URL for PgBouncer transaction pooling.
 * Neon serverless compute instances suspend when idle (scale-to-zero).
 * Setting pgbouncer=true disables prepared statements conflicting with PgBouncer.
 * Setting connection_limit=5 caps the pool size to prevent socket bloat.
 * Setting keepalives ensures TCP sockets send periodic probes to prevent proxy disconnects.
 */
function getResilientDatabaseUrl() {
  const rawUrl = process.env.DATABASE_URL || "";
  if (!rawUrl) return rawUrl;

  try {
    const url = new URL(rawUrl);
    if (!url.searchParams.has("connect_timeout")) {
      url.searchParams.set("connect_timeout", "15");
    }
    if (!url.searchParams.has("pool_timeout")) {
      url.searchParams.set("pool_timeout", "15");
    }
    if (!url.searchParams.has("connection_limit")) {
      url.searchParams.set("connection_limit", "5");
    }
    if (!url.searchParams.has("keepalives")) {
      url.searchParams.set("keepalives", "1");
    }
    if (!url.searchParams.has("keepalives_idle")) {
      url.searchParams.set("keepalives_idle", "30");
    }
    if (!url.searchParams.has("keepalives_interval")) {
      url.searchParams.set("keepalives_interval", "10");
    }
    if (url.hostname.includes("-pooler.") && !url.searchParams.has("pgbouncer")) {
      url.searchParams.set("pgbouncer", "true");
    }
    return url.toString();
  } catch (e) {
    return rawUrl;
  }
}

const resilientUrl = getResilientDatabaseUrl();

// Configure Prisma Client with connection pooling parameters suitable for serverless / Neon pooler
const prisma = new PrismaClient({
  datasources: resilientUrl
    ? {
        db: {
          url: resilientUrl,
        },
      }
    : undefined,
  log: [
    { emit: "event", level: "error" },
    { emit: "event", level: "warn" },
    ...(process.env.NODE_ENV === "development" ? [{ emit: "stdout", level: "query" }] : []),
  ],
});

// Event-based connection diagnostics without logging credentials or secrets
prisma.$on("error", (e) => {
  const msg = e.message || "";
  if (msg.includes("Error { kind: Closed, cause: None }") || msg.includes("kind: Closed")) {
    console.warn(
      `[Prisma Diagnostic] [${new Date().toISOString()}] Pooled idle connection was closed by remote database. Next query will acquire a fresh connection automatically.`
    );
  } else {
    // Sanitize any potential connection credentials before logging
    const sanitized = msg.replace(/postgresql:\/\/[^@]+@/gi, "postgresql://***:***@");
    console.error(`[Prisma Error] [${new Date().toISOString()}]:`, sanitized);
  }
});

prisma.$on("warn", (e) => {
  const sanitized = (e.message || "").replace(/postgresql:\/\/[^@]+@/gi, "postgresql://***:***@");
  console.warn(`[Prisma Warning] [${new Date().toISOString()}]:`, sanitized);
});

/**
 * Checks whether an error is a transient connection failure
 */
function isTransientDbError(err) {
  if (!err) return false;
  const msg = (err.message || "").toLowerCase();
  const code = err.code || "";

  return (
    code === "P1001" || // Can't reach database server
    code === "P1002" || // Database server timed out
    code === "P1008" || // Operations timed out
    code === "P1017" || // Server has closed the connection
    msg.includes("can't reach database server") ||
    msg.includes("connection timed out") ||
    msg.includes("connection closed") ||
    msg.includes("kind: closed") ||
    msg.includes("connection reset") ||
    msg.includes("econnreset") ||
    msg.includes("etimedout") ||
    msg.includes("endpoint is disabled")
  );
}

/**
 * Safely executes a database query with bounded retries for transient Neon connection spikes
 */
async function withDbRetry(queryFn, maxRetries = 2, baseDelayMs = 500) {
  let attempt = 0;
  while (true) {
    try {
      return await queryFn(prisma);
    } catch (err) {
      attempt++;
      if (attempt <= maxRetries && isTransientDbError(err)) {
        const delay = baseDelayMs * Math.pow(2, attempt - 1);
        console.warn(
          `[Prisma Retry] Transient connection failure (${err.code || "Connection Closed"}). Reconnecting in ${delay}ms (Attempt ${attempt}/${maxRetries})...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw err;
    }
  }
}

module.exports = prisma;
module.exports.prisma = prisma;
module.exports.withDbRetry = withDbRetry;
module.exports.isTransientDbError = isTransientDbError;
