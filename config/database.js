import { Sequelize } from "sequelize";
import initModels from "../models/index.js";

/**
 * Create Sequelize instance
 * - If `DATABASE_URL` is present use Postgres
 * - Otherwise fall back to local SQLite for development
 */
let sequelize;

if (process.env.DATABASE_URL) {
  const useSsl = process.env.DB_SSL === "true" || process.env.NODE_ENV === "production";

  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: "postgres",
    protocol: "postgres",
    logging: false,
    dialectOptions: useSsl
      ? {
          ssl: {
            require: true,
            rejectUnauthorized: false,
          },
        }
      : {},
    pool: {
      max: 5, // VERY IMPORTANT for Cloud Run
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  });
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
    console.log("✅ Database connected");

    await sequelize.sync();
    console.log("✅ Database synced");
  } catch (err) {
    console.error("❌ Database initialization error:", err);
    // ❌ DO NOT process.exit() on Cloud Run
  }
}

export { sequelize, models };
