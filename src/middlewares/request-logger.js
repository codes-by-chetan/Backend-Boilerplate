import logger from "../config/logger.js";
import { verifyAccessToken } from "../utils/token.js";
import getIpDetails from "../utils/get-ip-details.js";
import safeJson from "../utils/safe-json.js";
import { createRequestLog } from "../modules/logs/request-log.repository.js";

export const requestLogger = (req, res, next) => {
  const startedAt = Date.now();
  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);
  let responseBody = null;
  let userId = null;

  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
    if (token) {
      const decoded = verifyAccessToken(token);
      userId = decoded.sub || null;
    }
  } catch (error) {
    logger.warn("Unable to decode access token for request logging", { requestId: req.requestId });
  }

  res.json = (body) => {
    responseBody = safeJson(body);
    return originalJson(body);
  };

  res.send = (body) => {
    if (responseBody === null) {
      responseBody = safeJson(body);
    }

    return originalSend(body);
  };

  res.on("finish", async () => {
    const responseTimeMs = Date.now() - startedAt;
    const status = res.statusCode;
    const requestSummary = [
      `[${req.requestId}]`,
      req.method,
      req.originalUrl,
      status,
      `${responseTimeMs} ms`,
    ].join(" ");

    logger.request(requestSummary, {
      userId,
      ip: req.ip,
      origin: req.headers.origin || "Unknown",
    });

    try {
      await createRequestLog({
        requestType: req.headers["content-type"] || "Unknown",
        requestStatus: status >= 400 ? "Failed" : "Successful",
        errors: status >= 400 ? responseBody?.message || "Unknown error occurred" : null,
        ipAddress: getIpDetails(req),
        origin: req.headers.origin || "Unknown",
        requestMethod: req.method,
        requestUrl: req.originalUrl,
        requestHeaders: safeJson(req.headers),
        requestBody: safeJson(req.body),
        responseStatus: status,
        responseBody: responseBody === null ? null : safeJson(responseBody),
        responseTimeMs,
        userId,
      });
    } catch (error) {
      logger.error("Failed to save request log", error);
    }
  });

  next();
};
