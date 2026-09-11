import { Router } from "express";
import rateLimit from "express-rate-limit";
import { login, register } from "../controllers/auth.controller";

// Brute-force protection: max 10 attempts per 15 minutes per IP.
// Applied only to auth routes — login and register — to avoid false positives
// on read-heavy routes elsewhere in the app.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,  // return RateLimit-* headers
  legacyHeaders: false,
  message: { error: "Too many requests from this IP, please try again in 15 minutes." },
});

const router = Router();

router.use(authLimiter);
router.post("/register", register);
router.post("/login", login);

export default router;
