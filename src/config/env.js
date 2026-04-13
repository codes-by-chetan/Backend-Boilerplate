import dotenv from "dotenv";
import Joi from "joi";

dotenv.config();

const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid("development", "test", "production").default("development"),
  APP_NAME: Joi.string().default("backend-boilerplate"),
  PORT: Joi.number().port().default(5000),
  API_PREFIX: Joi.string().default("/api/v1"),
  CORS_ORIGIN: Joi.string().default("*"),
  DATABASE_URL: Joi.string()
    .uri({ scheme: [/postgres(?:ql)?/] })
    .required(),
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

const config = {
  env: value.NODE_ENV,
  appName: value.APP_NAME,
  port: value.PORT,
  apiPrefix: value.API_PREFIX,
  corsOrigins: value.CORS_ORIGIN.split(",").map((origin) => origin.trim()),
  databaseUrl: value.DATABASE_URL,
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
