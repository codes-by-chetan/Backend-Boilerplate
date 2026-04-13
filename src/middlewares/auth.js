import httpStatus from "http-status";

import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/async-handler.js";
import { getSessionById, getUserById } from "../modules/auth/auth.repository.js";
import { verifyAccessToken } from "../utils/token.js";

export const requireAuth = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

  if (!token) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Access token is required");
  }

  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid or expired access token");
  }

  const [user, session] = await Promise.all([
    getUserById(decoded.sub),
    getSessionById(decoded.sessionId),
  ]);

  if (!user || user.status !== "active") {
    throw new ApiError(httpStatus.UNAUTHORIZED, "User is not available");
  }

  if (!session || session.userId !== user.id || new Date(session.expiresAt) <= new Date()) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Session is invalid or expired");
  }

  req.user = user;
  req.session = session;
  next();
});

export const authorize =
  (...allowedRoles) =>
  (req, res, next) => {
    if (!req.user) {
      next(new ApiError(httpStatus.UNAUTHORIZED, "Authentication required"));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(new ApiError(httpStatus.FORBIDDEN, "You are not allowed to access this resource"));
      return;
    }

    next();
  };
