import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";

import config from "./config/env.js";
import logger from "./config/logger.js";
import { apiLimiter } from "./middlewares/rate-limit.js";
import notFoundHandler from "./middlewares/not-found.js";
import errorHandler from "./middlewares/error-handler.js";
import requestContext from "./middlewares/request-context.js";
import routes from "./routes/index.js";
import { requestLogger } from "./middlewares/request-logger.js";
import ApiResponse from "./utils/ApiResponse.js";

const app = express();

app.set("trust proxy", true);

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || config.corsOrigins.includes("*") || config.corsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);
app.use(compression());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(requestContext);
app.use(requestLogger);
app.use(apiLimiter);

app.get("/", (req, res) => {
  res.status(200).json(
    new ApiResponse(
      200,
      {
        name: config.appName,
        env: config.env,
        docs: `${config.apiPrefix}/health`,
      },
      "Backend boilerplate is healthy",
    ),
  );
});

app.use(config.apiPrefix, routes);

app.use(notFoundHandler);
app.use(errorHandler);

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled promise rejection", reason);
});

process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception", error);
});

export default app;
