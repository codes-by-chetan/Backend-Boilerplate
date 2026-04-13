import bcrypt from "bcrypt";
import httpStatus from "http-status";
import { v4 as uuidv4 } from "uuid";

import config from "../../config/env.js";
import ApiError from "../../utils/ApiError.js";
import {
  createAccessToken,
  createRefreshToken,
  getRefreshExpiryDate,
  hashToken,
  verifyRefreshToken,
} from "../../utils/token.js";
import prisma from "../../lib/prisma.js";
import {
  createSession,
  createUser,
  deleteSessionById,
  getSessionById,
  getUserById,
  getUserByEmail,
  sanitizeUser,
  updateLastLogin,
  updateSessionToken,
} from "./auth.repository.js";

const buildAuthPayload = ({ user, sessionId }) => {
  const accessToken = createAccessToken({
    sub: user.id,
    role: user.role,
    sessionId,
  });

  const refreshToken = createRefreshToken({
    sub: user.id,
    role: user.role,
    sessionId,
  });

  return {
    accessToken,
    refreshToken,
    refreshExpiresAt: getRefreshExpiryDate(),
  };
};

const createSessionBundle = async ({ user, userAgent, ipAddress }, client) => {
  const sessionId = uuidv4();
  const tokens = buildAuthPayload({ user, sessionId });

  await createSession(
    {
      id: sessionId,
      userId: user.id,
      refreshTokenHash: hashToken(tokens.refreshToken),
      userAgent,
      ipAddress,
      expiresAt: tokens.refreshExpiresAt,
    },
    client,
  );

  return tokens;
};

export const register = async ({ name, email, password }) =>
  prisma.$transaction(async (tx) => {
    const existingUser = await getUserByEmail(email, tx);
    if (existingUser) {
      throw new ApiError(httpStatus.CONFLICT, "A user with this email already exists");
    }

    const passwordHash = await bcrypt.hash(password, config.bcryptSaltRounds);
    const user = await createUser({ name, email, passwordHash }, tx);
    const tokens = await createSessionBundle({ user, userAgent: null, ipAddress: null }, tx);

    return {
      user: sanitizeUser(user),
      ...tokens,
    };
  });

export const login = async ({ email, password, userAgent, ipAddress }) =>
  prisma.$transaction(async (tx) => {
    const user = await getUserByEmail(email, tx);

    if (!user) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid email or password");
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid email or password");
    }

    if (user.status !== "active") {
      throw new ApiError(httpStatus.FORBIDDEN, "User account is inactive");
    }

    const updatedUser = await updateLastLogin(user.id, tx);
    const tokens = await createSessionBundle({ user: updatedUser, userAgent, ipAddress }, tx);

    return {
      user: sanitizeUser(updatedUser),
      ...tokens,
    };
  });

export const refreshSession = async (refreshToken) => {
  if (!refreshToken) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Refresh token is required");
  }

  let decoded;

  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid or expired refresh token");
  }

  const session = await getSessionById(decoded.sessionId);
  if (!session) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Session not found");
  }

  if (session.userId !== decoded.sub) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Refresh token does not belong to this session");
  }

  if (session.refreshTokenHash !== hashToken(refreshToken)) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Refresh token does not match session");
  }

  if (new Date(session.expiresAt) <= new Date()) {
    await deleteSessionById(session.id);
    throw new ApiError(httpStatus.UNAUTHORIZED, "Refresh session has expired");
  }

  return prisma.$transaction(async (tx) => {
    const user = await getUserById(decoded.sub, tx);
    if (!user || user.status !== "active") {
      throw new ApiError(httpStatus.UNAUTHORIZED, "User is not available");
    }

    const freshTokens = buildAuthPayload({
      user: { id: user.id, role: user.role },
      sessionId: session.id,
    });

    await updateSessionToken(
      session.id,
      hashToken(freshTokens.refreshToken),
      freshTokens.refreshExpiresAt,
      tx,
    );

    return {
      user: sanitizeUser(user),
      ...freshTokens,
    };
  });
};

export const logout = async (sessionId) => {
  await deleteSessionById(sessionId);
};
