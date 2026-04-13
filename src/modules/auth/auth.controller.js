import httpStatus from "http-status";

import config from "../../config/env.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/async-handler.js";
import { login, logout, refreshSession, register } from "./auth.service.js";
import { sanitizeUser } from "./auth.repository.js";

const refreshCookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: config.cookieSecure,
  path: "/",
};

const attachRefreshCookie = (res, token) => {
  res.cookie("refreshToken", token, refreshCookieOptions);
};

const clearRefreshCookie = (res) => {
  res.clearCookie("refreshToken", refreshCookieOptions);
};

export const registerController = asyncHandler(async (req, res) => {
  const result = await register(req.body);
  attachRefreshCookie(res, result.refreshToken);

  res.status(httpStatus.CREATED).json(
    new ApiResponse(
      httpStatus.CREATED,
      {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      },
      "User registered successfully",
    ),
  );
});

export const loginController = asyncHandler(async (req, res) => {
  const result = await login({
    ...req.body,
    userAgent: req.get("user-agent") || null,
    ipAddress: req.ip,
  });

  attachRefreshCookie(res, result.refreshToken);

  res.status(httpStatus.OK).json(
    new ApiResponse(
      httpStatus.OK,
      {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      },
      "Login successful",
    ),
  );
});

export const refreshController = asyncHandler(async (req, res) => {
  const token = req.cookies.refreshToken || req.body.refreshToken;
  const result = await refreshSession(token);

  attachRefreshCookie(res, result.refreshToken);

  res.status(httpStatus.OK).json(
    new ApiResponse(
      httpStatus.OK,
      {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      },
      "Token refreshed successfully",
    ),
  );
});

export const meController = asyncHandler(async (req, res) => {
  res
    .status(httpStatus.OK)
    .json(new ApiResponse(httpStatus.OK, { user: sanitizeUser(req.user) }, "Authenticated user"));
});

export const logoutController = asyncHandler(async (req, res) => {
  await logout(req.session.id);
  clearRefreshCookie(res);

  res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, null, "Logout successful"));
});
