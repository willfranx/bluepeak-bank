import express from "express"
import {    depositInsecure,
    withdrawInsecure,
    transferInsecure,
    getTransactionsInsecure
 } from "../controllers/transactionController.js";

const router = express.Router();


router.post("/insecure/deposit", depositInsecure)
router.post("/insecure/withdraw", withdrawInsecure)
router.post("/insecure/transfer", transferInsecure)
router.get("/insecure/:accountid", getTransactionsInsecure)

export default router