import prisma from "../../lib/prisma.js";
import { createDbLog } from "../logs/db-log.repository.js";

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
  db.user
    .create({
      data: {
        name,
        email,
        passwordHash,
        role,
      },
      select: userSelect,
    })
    .then(async (user) => {
      await createDbLog(
        {
          transactionType: "insert",
          transactionDetails: "Inserted a new user",
          affectedCollection: "User",
          affectedDocumentId: user.id,
          newValue: sanitizeUser(user),
        },
        db,
      );

      return user;
    });

export const updateLastLogin = async (userId, db = prisma) => {
  const previousUser = await db.user.findUnique({
    where: { id: userId },
    select: userSelect,
  });

  const user = await db.user.update({
    where: { id: userId },
    data: {
      lastLoginAt: new Date(),
    },
    select: userSelect,
  });

  await createDbLog(
    {
      transactionType: "update",
      transactionDetails: "Updated user last login",
      affectedCollection: "User",
      affectedDocumentId: user.id,
      previousValue: previousUser ? sanitizeUser(previousUser) : null,
      newValue: sanitizeUser(user),
    },
    db,
  );

  return user;
};

export const createSession = async (session, db = prisma) =>
  db.authSession
    .create({
      data: {
        id: session.id,
        userId: session.userId,
        refreshTokenHash: session.refreshTokenHash,
        userAgent: session.userAgent,
        ipAddress: session.ipAddress,
        expiresAt: session.expiresAt,
      },
    })
    .then(async (createdSession) => {
      await createDbLog(
        {
          transactionType: "insert",
          transactionDetails: "Inserted a new auth session",
          affectedCollection: "AuthSession",
          affectedDocumentId: createdSession.id,
          newValue: createdSession,
        },
        db,
      );

      return createdSession;
    });

export const getSessionById = async (sessionId, db = prisma) =>
  db.authSession.findUnique({
    where: { id: sessionId },
  });

export const updateSessionToken = async (sessionId, refreshTokenHash, expiresAt, db = prisma) => {
  const previousSession = await db.authSession.findUnique({
    where: { id: sessionId },
  });

  const updatedSession = await db.authSession.update({
    where: { id: sessionId },
    data: {
      refreshTokenHash,
      expiresAt,
    },
  });

  await createDbLog(
    {
      transactionType: "update",
      transactionDetails: "Updated an auth session",
      affectedCollection: "AuthSession",
      affectedDocumentId: updatedSession.id,
      previousValue: previousSession,
      newValue: updatedSession,
    },
    db,
  );

  return updatedSession;
};

export const deleteSessionById = async (sessionId, db = prisma) => {
  const existingSession = await db.authSession.findUnique({
    where: { id: sessionId },
  });

  await db.authSession.delete({
    where: { id: sessionId },
  });

  if (existingSession) {
    await createDbLog(
      {
        transactionType: "delete",
        transactionDetails: "Deleted an auth session",
        affectedCollection: "AuthSession",
        affectedDocumentId: existingSession.id,
        previousValue: existingSession,
      },
      db,
    );
  }
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
