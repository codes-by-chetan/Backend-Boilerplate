import dotenv from "dotenv";
import Joi from "joi";

import getHostIpAddress from "../utils/host-ip.js";

dotenv.config();

/**
 * Derives the PostgreSQL connection URL from environment variables.
 * Supports flexible configuration for different deployment environments.
 *
 * Priority order:
 * 1. DATABASE_URL (recommended for production)
 * 2. POSTGRES_INTERNAL_URL (Vercel)
 * 3. POSTGRES_URL (generic platform-specific)
 * 4. RENDER_DATABASE_URL (Render.com)
 * 5. Individual components (DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME) - recommended for development
 */
const deriveDatabaseUrl = () => {
  // Check for direct connection strings (preferred)
  const directUrl =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_INTERNAL_URL ||
    process.env.POSTGRES_URL ||
    process.env.RENDER_DATABASE_URL;

  if (directUrl) {
    return directUrl;
  }

  // Fallback: build from individual components (for local development)
  const host = process.env.DB_HOST || "localhost";
  const port = process.env.DB_PORT || "5432";
  const user = process.env.DB_USER || "postgres";
  const password = process.env.DB_PASSWORD || "postgres";
  const name = process.env.DB_NAME || "backend_boilerplate";

  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${name}`;
};

process.env.DATABASE_URL = deriveDatabaseUrl();

const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid("development", "test", "production").default("development"),
  APP_NAME: Joi.string().default("backend-boilerplate"),
  PORT: Joi.number().port().default(5000),
  API_PREFIX: Joi.string().default("/api/v1"),
  CORS_ORIGIN: Joi.string().default("*"),
  APP_ORIGINS: Joi.string().optional(),
  TRUST_PROXY: Joi.alternatives()
    .try(
      Joi.boolean().truthy("true").truthy("1").falsy("false").falsy("0"),
      Joi.number().integer().min(0),
      Joi.string().valid("loopback", "linklocal", "uniquelocal"),
    )
    .default(false),
  // Individual DB components (optional, only used if DATABASE_URL not set)
  DB_HOST: Joi.string().optional(),
  DB_PORT: Joi.number().port().optional(),
  DB_USER: Joi.string().optional(),
  DB_PASSWORD: Joi.string().allow("").optional(),
  DB_NAME: Joi.string().optional(),
  DB_MAINTENANCE_NAME: Joi.string().default("postgres"),
  // Main connection URL (required - built from above if not provided)
  DATABASE_URL: Joi.string()
    .uri({ scheme: [/postgres(?:ql)?/] })
    .required(),
  // Database initialization
  BOOTSTRAP_DB: Joi.boolean().truthy("true").truthy("1").falsy("false").falsy("0").default(true),
  BOOTSTRAP_ADMIN: Joi.boolean().truthy("true").truthy("1").falsy("false").falsy("0").default(true),
  // Admin user (created on bootstrap)
  ADMIN_NAME: Joi.string().default("System Admin"),
  ADMIN_EMAIL: Joi.string().email().default("admin@example.com"),
  ADMIN_PASSWORD: Joi.string().min(8).default("admin12345"),
  // JWT configuration
  JWT_ACCESS_SECRET: Joi.string().min(16).required(),
  JWT_REFRESH_SECRET: Joi.string().min(16).required(),
  JWT_ACCESS_EXPIRES_IN: Joi.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default("7d"),
  // Bcrypt configuration
  BCRYPT_SALT_ROUNDS: Joi.number().integer().min(8).max(15).default(12),
  // Logging
  LOG_LEVEL: Joi.string().valid("debug", "info", "warn", "error").default("debug"),
  // Security
  COOKIE_SECURE: Joi.boolean().truthy("true").truthy("1").falsy("false").falsy("0").default(false),
})
  .unknown()
  .required();

const { value, error } = envSchema.validate(process.env, {
  abortEarly: false,
  errors: { label: "key" },
});

if (error) {
  throw new Error(`Environment validation failed: ${error.message}`);
}

// Parse DATABASE_URL to extract components
const parsedDatabaseUrl = new URL(value.DATABASE_URL);
const urlDbName = decodeURIComponent(parsedDatabaseUrl.pathname.replace(/^\//, ""));
const urlPort = parsedDatabaseUrl.port ? Number(parsedDatabaseUrl.port) : 5432;
const urlUser = decodeURIComponent(parsedDatabaseUrl.username || "postgres");
const urlPassword = decodeURIComponent(parsedDatabaseUrl.password || "postgres");

const detectedHostIp = getHostIpAddress();
const detectedNetworkOrigin = `http://${detectedHostIp}:${value.PORT}`;
const configuredAppOrigins = (value.APP_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const config = {
  env: value.NODE_ENV,
  appName: value.APP_NAME,
  port: value.PORT,
  apiPrefix: value.API_PREFIX,
  corsOrigins: value.CORS_ORIGIN.split(",").map((origin) => origin.trim()),
  appOrigins: Array.from(
    new Set([
      ...configuredAppOrigins,
      `http://localhost:${value.PORT}`,
      `http://127.0.0.1:${value.PORT}`,
      detectedNetworkOrigin,
    ]),
  ),
  networkOrigin: detectedNetworkOrigin,
  trustProxy: value.TRUST_PROXY,
  databaseUrl: value.DATABASE_URL,
  database: {
    host: value.DB_HOST || parsedDatabaseUrl.hostname || "localhost",
    port: value.DB_PORT || urlPort,
    user: value.DB_USER || urlUser,
    password: value.DB_PASSWORD ?? urlPassword,
    name: value.DB_NAME || urlDbName || "backend_boilerplate",
    maintenanceDb: value.DB_MAINTENANCE_NAME,
    bootstrapEnabled: value.BOOTSTRAP_DB,
  },
  admin: {
    bootstrapEnabled: value.BOOTSTRAP_ADMIN,
    name: value.ADMIN_NAME,
    email: value.ADMIN_EMAIL,
    password: value.ADMIN_PASSWORD,
  },
  jwt: {
    accessSecret: value.JWT_ACCESS_SECRET,
    refreshSecret: value.JWT_REFRESH_SECRET,
    accessExpiresIn: value.JWT_ACCESS_EXPIRES_IN,
    refreshExpiresIn: value.JWT_REFRESH_EXPIRES_IN,
  },
  bcryptSaltRounds: value.BCRYPT_SALT_ROUNDS,
  logLevel: value.LOG_LEVEL,
  cookieSecure: value.COOKIE_SECURE,
  isProduction: value.NODE_ENV === "production",
};

export default config;
