import httpStatus from "http-status";

import ApiError from "../utils/ApiError.js";

const notFoundHandler = (req, res, next) => {
  next(new ApiError(httpStatus.NOT_FOUND, `Route not found: ${req.method} ${req.originalUrl}`));
};

export default notFoundHandler;
