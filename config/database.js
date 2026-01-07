import { Sequelize } from "sequelize";
import initModels from "../models/index.js";

/**
 * Create Sequelize instance
 * - If `DATABASE_URL` is present use Postgres
 * - Otherwise fall back to local SQLite for development
 */
let sequelize;
// Allow forcing the local sqlite fallback for development/testing even if a
// system `DATABASE_URL` is present. Set `FORCE_SQLITE=true` in your env to
// prefer sqlite (useful when system envs point to Docker host names like
// `db` that aren't resolvable on the developer machine).
if (process.env.FORCE_SQLITE === 'true') {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: process.env.DB_STORAGE || './database.sqlite',
    logging: false,
  });

} else if (process.env.DATABASE_URL) {
  // Basic validation for DATABASE_URL to provide clearer errors
  try {
    // Use the WHATWG URL parser to validate format
    new URL(process.env.DATABASE_URL);
  } catch (e) {
    console.error("FATAL: Invalid DATABASE_URL:", process.env.DATABASE_URL);
    throw new Error("Invalid DATABASE_URL environment variable. Ensure it's a valid postgres URL like 'postgres://user:pass@host:5432/dbname'");
  }

  const useSsl = process.env.DB_SSL === "true" || process.env.NODE_ENV === "production";

  try {
    // Detect serverless environment (Vercel sets VERCEL env var)
    const isServerless = !!process.env.VERCEL || process.env.SERVERLESS === 'true' || !!process.env.AWS_LAMBDA_FUNCTION_NAME;

    const poolOptions = isServerless
      ? { max: 1, min: 0, acquire: 20000, idle: 10000, evict: 10000 }
      : { max: 5, min: 0, acquire: 30000, idle: 10000 };

    sequelize = new Sequelize(process.env.DATABASE_URL, {
      dialect: "postgres",
      protocol: "postgres",
      logging: false,
      dialectOptions: useSsl
        ? {
            ssl: {
              require: true,
              // Supabase uses certificates that may not validate in some runtimes; disable verification
              rejectUnauthorized: false,
            },
          }
        : {},
      pool: poolOptions,
      // Avoid timezone/pool keep-alive settings here; keeping minimal options for serverless safety
    });
  } catch (e) {
    console.error("FATAL: Sequelize initialization failed with DATABASE_URL:", e && e.message ? e.message : e);
    throw e;
  }
} else {
  // Local development: use SQLite file storage
  sequelize = new Sequelize({
    dialect: "sqlite",
    storage: process.env.DB_STORAGE || "./database.sqlite",
    logging: false,
  });
}

/**
 * Initialize all models and associations ONCE
 */
const models = initModels(sequelize);

/**
 * Non-blocking DB bootstrap
 * Cloud Run safe: does NOT block startup
 */
export async function initDatabase() {
  try {
    await sequelize.authenticate();
    // Log which DB we're connected to (masked credentials)
    if (process.env.DATABASE_URL) {
      const url = process.env.DATABASE_URL;
      const masked = url.replace(/:\/\/(.*@)/, '://****@');
      console.log("✅ Database connected (DATABASE_URL):", masked);
      // Temporary startup check for Supabase usage
      try {
        console.log("DB connected:", process.env.DATABASE_URL && process.env.DATABASE_URL.includes("supabase"));
      } catch (e) {
        // ignore
      }
    } else {
      const storage = process.env.DB_STORAGE || './database.sqlite';
      console.log("✅ Database connected (sqlite storage):", storage);
    }

    await sequelize.sync();
    console.log("✅ Database synced");
  } catch (err) {
    console.error("❌ Database initialization error:", err);
    // ❌ DO NOT process.exit() on Cloud Run
  }
}

export { sequelize, models };
