import express from "express";
import { createAccountInsecure, getUserAccountsInsecure, deleteAccountInsecure   } from "../controllers/bankAccountController.js";

const router = express.Router();


// Account routes (insecure)
router.post("/insecure/", createAccountInsecure);
router.get("/insecure/:userid", getUserAccountsInsecure);
router.delete("/insecure/:accountid", deleteAccountInsecure); 

export default router;
