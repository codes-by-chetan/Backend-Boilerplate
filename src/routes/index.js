import { Router } from "express";

import authRoutes from "./auth.routes.js";
import healthRoutes from "./health.routes.js";
import logsRoutes from "../modules/logs/logs.route.js";

const router = Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/logs", logsRoutes);

export default router;
