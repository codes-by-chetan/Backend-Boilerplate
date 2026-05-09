import { Router } from "express";

import roles from "../../constants/roles.js";
import { authorize, requireAuth } from "../../middlewares/auth.js";
import { getAllLogs, getLogByFileName, getLogsByDate, getRecentLogs } from "./logs.controller.js";

const router = Router();

// Comment out the next line in development if you want to temporarily bypass auth for logs.
router.use(requireAuth, authorize(roles.ADMIN));

router.get("/", getAllLogs);
router.get("/recents", getRecentLogs);
router.get("/by-date/:date", getLogsByDate);
router.get("/file/:fileName", getLogByFileName);

export default router;
