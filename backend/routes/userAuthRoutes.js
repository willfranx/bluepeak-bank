import express from "express";
import { register, login, profile, logout, refreshAccessToken, updatePassword } from "../controllers/userAuthController.js";
import { protect } from "../middleware/authProtectMiddleware.js";
import { validate } from "../middleware/validate.js"
import { registerSchema, loginSchema, updatePasswordSchema } from "../schemas/userSchema.js";

const router = express.Router();

// Auth routes
router.post("/register", validate({ body: registerSchema }), register);
router.post("/login", validate({ body: loginSchema }), login);
router.post("/logout", protect, logout);
router.get("/profile", protect, profile);
router.post("/refresh-token", refreshAccessToken);
router.post("/updatePassword", protect, validate({ body: updatePasswordSchema}), updatePassword)

export default router;