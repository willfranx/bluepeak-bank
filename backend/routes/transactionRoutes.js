import express from "express"
import { protect } from "../middleware/authProtectMiddleware.js"
import {deposit, withdraw, transfer, transaction } from "../controllers/transactionController.js"

const router = express.Router();

// Protect these routes
router.use(protect)

router.post("/deposit", deposit)
router.post("/withdraw", withdraw)
router.post("/transfer", transfer)
router.get("/:accountid", transaction)

export default router