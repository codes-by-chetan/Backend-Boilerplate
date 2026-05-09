import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";

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
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set("trust proxy", config.trustProxy);

const allowedOrigins = new Set([...config.corsOrigins, ...config.appOrigins].filter(Boolean));

app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://unpkg.com"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'", "https://unpkg.com"],
        fontSrc: ["'self'", "data:"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        frameAncestors: ["'self'"],
        formAction: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    originAgentCluster: false,
  }),
);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has("*") || allowedOrigins.has(origin)) {
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
app.use(
  express.static(path.join(__dirname, "../public"), {
    setHeaders(res, filePath) {
      if (filePath.endsWith(".html")) {
        res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");
      }
    },
  }),
);
app.get("/admin", (req, res) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.sendFile(path.join(__dirname, "../public/admin/index.html"));
});
app.get("/admin/log-viewer.html", (req, res) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.sendFile(path.join(__dirname, "../public/admin/log-viewer.html"));
});

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
