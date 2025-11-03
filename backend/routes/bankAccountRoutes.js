import express from "express";
import { createAccount, getUserAccounts, deleteAccount  } from "../controllers/bankAccountController.js";
import { protect } from "../middleware/authProtectMiddleware.js"

const router = express.Router();

// Acoount routes
router.post("/", protect, createAccount);
router.get("/:userid", protect, getUserAccounts);
router.delete("/:accountid", protect, deleteAccount);


export default router;
