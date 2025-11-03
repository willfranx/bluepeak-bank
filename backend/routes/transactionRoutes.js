import express from "express"
import { protect } from "../middleware/authProtectMiddleware.js"
import {deposit, withdraw, transfer, getTransactions } from "../controllers/transactionController.js"

const router = express.Router();

// // Protect these routes
// router.use(protect)

router.post("/deposit", protect, deposit)
router.post("/withdraw", protect, withdraw)
router.post("/transfer", protect, transfer)
router.get("/:accountid", protect, getTransactions)



export default router