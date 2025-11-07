import express from "express";
import { register, login, profile, logout } from "../controllers/userAuthController.js";
import { protect } from "../middleware/authProtectMiddleware.js";
import { validate } from "../middleware/validate.js"
import { registerSchema, loginSchema } from "../schemas/userSchema.js";

const router = express.Router();

// Auth routes
router.post("/register", validate({ body: registerSchema }), register);
router.post("/login", validate({ body: loginSchema }), login);
router.post("/logout", protect, logout);
router.get("/profile", protect, profile);

export default router;