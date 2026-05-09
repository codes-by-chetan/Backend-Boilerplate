import config from "../config/env.js";
import logger from "../config/logger.js";
import { bootstrapDatabase } from "./bootstrap.js";
import prisma from "../lib/prisma.js";

export const testDatabaseConnection = async () => {
  await prisma.$connect();
  await prisma.$queryRaw`SELECT 1`;
  logger.success("Connected to PostgreSQL through Prisma");
};

export const initializeDatabase = async () => {
  if (config.database.bootstrapEnabled) {
    await bootstrapDatabase();
    return;
  }

  logger.info("Database bootstrap disabled. Skipping automatic database/schema/admin setup");
};

export const closePool = async () => {
  await prisma.$disconnect();
};
