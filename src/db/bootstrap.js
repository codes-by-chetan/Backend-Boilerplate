import bcrypt from "bcrypt";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

import pg from "pg";

import config from "../config/env.js";
import logger from "../config/logger.js";

const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const quoteIdentifier = (value) => `"${String(value).replace(/"/g, '""')}"`;

const buildConnectionString = ({ database }) => {
  const credentials = `${encodeURIComponent(config.database.user)}:${encodeURIComponent(config.database.password)}`;
  return `postgresql://${credentials}@${config.database.host}:${config.database.port}/${database}`;
};

const createClient = (database) =>
  new Client({
    connectionString: buildConnectionString({ database }),
  });

export const ensureDatabaseExists = async () => {
  const client = createClient(config.database.maintenanceDb);

  try {
    await client.connect();
    const result = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [
      config.database.name,
    ]);

    if (result.rowCount > 0) {
      logger.info(`Database "${config.database.name}" already exists`);
      return;
    }

    await client.query(`CREATE DATABASE ${quoteIdentifier(config.database.name)}`);
    logger.success(`Created database "${config.database.name}"`);
  } finally {
    await client.end();
  }
};

export const ensureSchemaExists = async () => {
  const schemaSql = await fs.readFile(path.join(__dirname, "bootstrap.sql"), "utf8");
  const client = createClient(config.database.name);

  try {
    await client.connect();
    await client.query(schemaSql);
    logger.success("Database schema is ready");
  } finally {
    await client.end();
  }
};

export const ensureAdminUser = async () => {
  if (!config.admin.bootstrapEnabled) {
    logger.info("Admin bootstrap disabled. Skipping admin seed");
    return;
  }

  const client = createClient(config.database.name);

  try {
    await client.connect();
    const existingAdmins = await client.query(
      "SELECT COUNT(*)::int AS count FROM users WHERE role = 'admin'",
    );
    const adminCount = existingAdmins.rows[0]?.count || 0;

    if (adminCount > 0) {
      logger.info("Admin user already exists. Skipping admin seed");
      return;
    }

    const passwordHash = await bcrypt.hash(config.admin.password, config.bcryptSaltRounds);
    await client.query(
      `INSERT INTO users (name, email, password_hash, role, status)
       VALUES ($1, $2, $3, 'admin', 'active')
       ON CONFLICT (email) DO NOTHING`,
      [config.admin.name, config.admin.email, passwordHash],
    );

    logger.success(`Seeded bootstrap admin user: ${config.admin.email}`);
  } finally {
    await client.end();
  }
};

export const bootstrapDatabase = async () => {
  await ensureDatabaseExists();
  await ensureSchemaExists();
  await ensureAdminUser();
};
