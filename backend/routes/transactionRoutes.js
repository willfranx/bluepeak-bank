import express from "express"
import { protect } from "../middleware/authProtectMiddleware.js"
import { validate } from "../middleware/validate.js"

import {deposit, withdraw, transfer, getTransactions } from "../controllers/transactionController.js"
// import { depositSchema, transferSchema, withdrawSchema } from "../schemas/transactionSchema.js";

const router = express.Router();

// Transaction routes
// router.post("/deposit", protect, validate(depositSchema), deposit);
// router.post("/withdraw", protect, validate(withdrawSchema), withdraw);
// router.post("/transfer", protect, validate(transferSchema), transfer);
// router.get("/", protect, getTransactions); 

// 
router.post("/deposit", protect, deposit);
router.post("/withdraw", protect, withdraw);
router.post("/transfer", protect, transfer);
router.get("/", protect, getTransactions);

export default router