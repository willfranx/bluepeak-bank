import express from "express";
import { createAccount, getUserAccounts, deleteAccount  } from "../controllers/accountController.js";

const router = express.Router();

// Accoount routes
router.post("/", createAccount);
router.get("/:userid", getUserAccounts);
router.delete("/:accountid", deleteAccount);

export default router;
