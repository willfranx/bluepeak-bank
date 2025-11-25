import express from "express";
import { register, login, profile, logout, refreshAccessToken, updatePassword, updateUser, deleteUser } from "../controllers/userAuthController.js";
import { protect } from "../middleware/authProtectMiddleware.js";
import { validate } from "../middleware/validate.js"
import { registerSchema, loginSchema, updatePasswordSchema, updateProfileSchema } from "../schemas/userSchema.js";
import { loginLimiter, refreshLimiter, registerLimiter } from "../middleware/rateLimit.js";
import { resendOTP, verifyOTP } from "../controllers/verifyController.js";

const router = express.Router();

// Auth routes
router.post("/register", validate({ body: registerSchema }), registerLimiter, register);
router.post("/login", validate({ body: loginSchema }), loginLimiter, login);
router.post("/logout", protect, logout);
router.get("/profile", protect, profile);
router.post("/updatePassword", protect, validate({ body: updatePasswordSchema}), updatePassword)
router.post("/refresh-token", refreshLimiter, refreshAccessToken);
router.post("/verify-otp", verifyOTP);
router.post("/resend-otp", resendOTP);
// Update profile and delete account
router.put("/profile", protect, validate({ body: updateProfileSchema }), updateUser);
router.delete("/delete", protect, deleteUser);

export default router;