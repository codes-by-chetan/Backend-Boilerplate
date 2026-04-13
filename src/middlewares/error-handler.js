import httpStatus from "http-status";

import logger from "../config/logger.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

const errorHandler = (error, req, res, next) => {
  const normalizedError =
    error instanceof ApiError
      ? error
      : new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Something went wrong");

  logger.error(`[${req.requestId || "n/a"}] ${normalizedError.message}`, {
    path: req.originalUrl,
    method: req.method,
    details: normalizedError.details,
    stack: error.stack,
  });

  res
    .status(normalizedError.statusCode)
    .json(
      new ApiResponse(normalizedError.statusCode, normalizedError.details, normalizedError.message),
    );
};

export default errorHandler;
