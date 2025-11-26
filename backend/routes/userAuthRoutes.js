import express from "express";
import { register, login, profile, logout, refreshAccessToken, updatePassword, updateName, updateEmail, deleteUser } from "../controllers/userAuthController.js";
import { protect } from "../middleware/authProtectMiddleware.js";
import { validate } from "../middleware/validate.js"
import { registerSchema, loginSchema, updatePasswordSchema, updateNameSchema , updateEmailSchema } from "../schemas/userSchema.js";
import { loginLimiter, refreshLimiter, registerLimiter } from "../middleware/rateLimit.js";
import { resendOTP, verifyOTP, verifyNewEmailOTP, resendNewEmailOTP } from "../controllers/verifyController.js";

const router = express.Router();

// Auth routes
router.post("/register", validate({ body: registerSchema }), registerLimiter, register);
router.post("/login", validate({ body: loginSchema }), loginLimiter, login);
router.post("/logout", protect, logout);
router.get("/profile", protect, profile);
router.post("/updatePassword", protect, validate({ body: updatePasswordSchema }), updatePassword)
router.post("/updateName", protect, validate({ body: updateNameSchema }), updateName)
router.post("/updateEmail", protect, validate({ body: updateEmailSchema }), updateEmail)
router.post("/deleteUser", protect, validate({ body: loginSchema}), deleteUser)
router.post("/refresh-token", refreshLimiter, refreshAccessToken);
router.post("/verify-otp", verifyOTP);
router.post("/resend-otp", resendOTP);
router.post("/verify-newemail-otp", verifyNewEmailOTP);
router.post("/resend-newemail-otp", resendNewEmailOTP);

export default router;