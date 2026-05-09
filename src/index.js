import app from "./app.js";
import config from "./config/env.js";
import logger from "./config/logger.js";
import { closePool, initializeDatabase, testDatabaseConnection } from "./db/prisma.js";
import getHostIpAddress from "./utils/host-ip.js";

const startServer = async () => {
  try {
    await initializeDatabase();
    await testDatabaseConnection();

    const server = app.listen(config.port, () => {
      const hostIp = getHostIpAddress();
      const localhostUrl = `http://localhost:${config.port}`;
      const networkUrl = `http://${hostIp}:${config.port}`;

      logger.success(`${config.appName} is running on port ${config.port}`);
      logger.info(`Environment: ${config.env}`);
      logger.info(`Local URL: ${localhostUrl}`);
      logger.info(`Network URL: ${networkUrl}`);
      logger.info(`Allowed app origins: ${config.appOrigins.join(", ")}`);
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
