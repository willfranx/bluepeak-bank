import express from "express"
import { protect } from "../middleware/authProtectMiddleware.js"
import {deposit, withdraw, transfer, transaction } from "../controllers/transactionController.js"

const router = express.Router();

// Protect these routes
router.post("/deposit", protect, deposit)
router.post("/withdraw", protect, withdraw)
router.post("/transfer", protect, transfer)
router.get("/:accountid", protect, transaction)

export default router