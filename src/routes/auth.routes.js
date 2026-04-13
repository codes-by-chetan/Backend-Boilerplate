import { Router } from "express";

import { requireAuth } from "../middlewares/auth.js";
import { authLimiter } from "../middlewares/rate-limit.js";
import validate from "../middlewares/validate.js";
import {
  loginController,
  logoutController,
  meController,
  refreshController,
  registerController,
} from "../modules/auth/auth.controller.js";
import {
  loginValidation,
  refreshValidation,
  registerValidation,
} from "../modules/auth/auth.validation.js";

const router = Router();

router.post("/register", authLimiter, validate(registerValidation), registerController);
router.post("/login", authLimiter, validate(loginValidation), loginController);
router.post("/refresh", validate(refreshValidation), refreshController);
router.get("/me", requireAuth, meController);
router.post("/logout", requireAuth, logoutController);

export default router;
