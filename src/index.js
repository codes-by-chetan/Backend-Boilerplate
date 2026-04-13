import app from "./app.js";
import config from "./config/env.js";
import logger from "./config/logger.js";
import { closePool, initializeDatabase, testDatabaseConnection } from "./db/prisma.js";

const startServer = async () => {
  try {
    await testDatabaseConnection();
    await initializeDatabase();

    const server = app.listen(config.port, () => {
      logger.success(`${config.appName} is running on port ${config.port}`);
      logger.info(`Environment: ${config.env}`);
    });

    const shutdown = async (signal) => {
      logger.warn(`Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        await closePool();
        logger.success("HTTP server and database pool closed");
        process.exit(0);
      });
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  } catch (error) {
    logger.error("Failed to start server", error);
    process.exit(1);
  }
};

startServer();
