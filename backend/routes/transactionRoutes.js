import express from "express"
import { protect } from "../middleware/authProtectMiddleware.js"
import { validate } from "../middleware/validate.js"

import {deposit, withdraw, transfer, getTransactions, transferToUser } from "../controllers/transactionController.js"
import { depositSchema, transferSchema, transferToUserSchema, withdrawSchema } from "../schemas/transactionSchema.js"

const router = express.Router();

// Transaction routes -> Protected and Validated
router.post("/deposit", protect, validate({ body: depositSchema }), deposit);
router.post("/withdraw", protect, validate({ body: withdrawSchema }), withdraw);
router.post("/transfer", protect, validate({ body: transferSchema }), transfer);
router.post("/send", protect, validate({ body: transferToUserSchema }), transferToUser); 
router.get("/", protect, getTransactions);

export default router