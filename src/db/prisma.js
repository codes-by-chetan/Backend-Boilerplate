import logger from "../config/logger.js";
import prisma from "../lib/prisma.js";

export const testDatabaseConnection = async () => {
  await prisma.$connect();
  await prisma.$queryRaw`SELECT 1`;
  logger.success("Connected to PostgreSQL through Prisma");
};

export const initializeDatabase = async () => {
  logger.info("Prisma schema setup is managed through prisma commands");
};

export const closePool = async () => {
  await prisma.$disconnect();
};
