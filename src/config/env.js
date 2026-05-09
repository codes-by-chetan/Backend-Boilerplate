import dotenv from "dotenv";
import Joi from "joi";

import getHostIpAddress from "../utils/host-ip.js";

dotenv.config();

const deriveDatabaseUrl = () => {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

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
  DB_HOST: Joi.string().default("localhost"),
  DB_PORT: Joi.number().port().default(5432),
  DB_USER: Joi.string().default("postgres"),
  DB_PASSWORD: Joi.string().allow("").default("postgres"),
  DB_NAME: Joi.string().default("backend_boilerplate"),
  DB_MAINTENANCE_NAME: Joi.string().default("postgres"),
  DATABASE_URL: Joi.string()
    .uri({ scheme: [/postgres(?:ql)?/] })
    .required(),
  BOOTSTRAP_DB: Joi.boolean().truthy("true").truthy("1").falsy("false").falsy("0").default(true),
  BOOTSTRAP_ADMIN: Joi.boolean().truthy("true").truthy("1").falsy("false").falsy("0").default(true),
  ADMIN_NAME: Joi.string().default("System Admin"),
  ADMIN_EMAIL: Joi.string().email().default("admin@example.com"),
  ADMIN_PASSWORD: Joi.string().min(8).default("admin12345"),
  JWT_ACCESS_SECRET: Joi.string().min(16).required(),
  JWT_REFRESH_SECRET: Joi.string().min(16).required(),
  JWT_ACCESS_EXPIRES_IN: Joi.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default("7d"),
  BCRYPT_SALT_ROUNDS: Joi.number().integer().min(8).max(15).default(12),
  LOG_LEVEL: Joi.string().valid("debug", "info", "warn", "error").default("debug"),
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
    host: value.DB_HOST,
    port: value.DB_PORT,
    user: value.DB_USER,
    password: value.DB_PASSWORD,
    name: value.DB_NAME,
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
