import prisma from "../../lib/prisma.js";

export const createRequestLog = async (data) =>
  prisma.requestLog.create({
    data,
  });
