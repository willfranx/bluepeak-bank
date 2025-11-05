import express from "express";
import { register, login, profile, logout } from "../controllers/userAuthController.js";
import { protect } from "../middleware/authProtectMiddleware.js";

const router = express.Router();

// Auth routes
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/profile", protect, profile);

export default router;
