import { Router } from "express";

import ApiResponse from "../utils/ApiResponse.js";

const router = Router();

router.get("/", (req, res) => {
  res.status(200).json(
    new ApiResponse(
      200,
      {
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      },
      "Service is healthy",
    ),
  );
});

export default router;
