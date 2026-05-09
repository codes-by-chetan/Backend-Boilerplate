import prisma from "../../lib/prisma.js";
import { getRequestStore } from "../../lib/request-store.js";
import safeJson from "../../utils/safe-json.js";

const buildContextFields = () => {
  const context = getRequestStore();

  return {
    userId: context?.user?.id || null,
    ipAddress: context?.ip || null,
    origin: context?.origin || null,
    requestId: context?.requestId || null,
  };
};

export const createDbLog = async ({
  transactionType,
  transactionDetails,
  affectedCollection,
  affectedDocumentId,
  previousValue = null,
  newValue = null,
  status = "success",
}, db = prisma) =>
  db.dbLog.create({
    data: {
      transactionType,
      transactionDetails,
      affectedCollection,
      affectedDocumentId,
      previousValue: safeJson(previousValue),
      newValue: safeJson(newValue),
      status,
      ...buildContextFields(),
    },
  });
