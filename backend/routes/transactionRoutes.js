import express from "express"
import { protect } from "../middleware/authProtectMiddleware.js"
import {deposit, withdraw, transfer, getTransactions } from "../controllers/transactionController.js"

const router = express.Router();

// Protect these routes
router.use(protect)

// Transaction routes
router.post("/deposit", deposit)
router.post("/withdraw", withdraw)
router.post("/transfer", transfer)
router.get("/:accountid", getTransactions)

export default router