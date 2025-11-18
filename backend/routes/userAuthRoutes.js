import express from "express";
import { register, login, profile, logout, refreshAccessToken } from "../controllers/userAuthController.js";
import { protect } from "../middleware/authProtectMiddleware.js";
import { validate } from "../middleware/validate.js"
import { registerSchema, loginSchema } from "../schemas/userSchema.js";
import { loginLimiter, refreshLimiter, registerLimiter } from "../middleware/rateLimit.js";

const router = express.Router();

// Auth routes
router.post("/register", validate({ body: registerSchema }), registerLimiter, register);
router.post("/login", validate({ body: loginSchema }), loginLimiter, login);
router.post("/logout", protect, logout);
router.get("/profile", protect, profile);
router.post("/refresh-token", refreshLimiter, refreshAccessToken);

export default router;