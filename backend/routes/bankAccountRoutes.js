import express from "express";
import { createAccount, getUserAccounts, deleteAccount  } from "../controllers/bankAccountController.js";
import { protect } from "../middleware/authProtectMiddleware.js"

const router = express.Router();

// Account routes
router.post("/", createAccount);
router.get("/:userid", protect, getUserAccounts);
router.delete("/:accountid", protect, deleteAccount);

export default router;
