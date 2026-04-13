import prisma from "../../lib/prisma.js";

const userSelect = {
  id: true,
  name: true,
  email: true,
  passwordHash: true,
  role: true,
  status: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
};

export const getUserByEmail = async (email, db = prisma) =>
  db.user.findUnique({
    where: { email },
    select: userSelect,
  });

export const getUserById = async (id, db = prisma) =>
  db.user.findUnique({
    where: { id },
    select: userSelect,
  });

export const createUser = async ({ name, email, passwordHash, role = "user" }, db = prisma) =>
  db.user.create({
    data: {
      name,
      email,
      passwordHash,
      role,
    },
    select: userSelect,
  });

export const updateLastLogin = async (userId, db = prisma) =>
  db.user.update({
    where: { id: userId },
    data: {
      lastLoginAt: new Date(),
    },
    select: userSelect,
  });

export const createSession = async (session, db = prisma) =>
  db.authSession.create({
    data: {
      id: session.id,
      userId: session.userId,
      refreshTokenHash: session.refreshTokenHash,
      userAgent: session.userAgent,
      ipAddress: session.ipAddress,
      expiresAt: session.expiresAt,
    },
  });

export const getSessionById = async (sessionId, db = prisma) =>
  db.authSession.findUnique({
    where: { id: sessionId },
  });

export const updateSessionToken = async (sessionId, refreshTokenHash, expiresAt, db = prisma) =>
  db.authSession.update({
    where: { id: sessionId },
    data: {
      refreshTokenHash,
      expiresAt,
    },
  });

export const deleteSessionById = async (sessionId, db = prisma) => {
  await db.authSession.delete({
    where: { id: sessionId },
  });
};

export const sanitizeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  status: user.status,
  lastLoginAt: user.lastLoginAt,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});
