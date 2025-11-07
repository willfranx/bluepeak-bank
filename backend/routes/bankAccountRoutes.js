import express from "express";
import { createAccount, getUserAccounts, deleteAccount  } from "../controllers/bankAccountController.js";
import { protect } from "../middleware/authProtectMiddleware.js"
import { validate } from "../middleware/validate.js"
import { createAccountSchema, accountIdSchema, userIdSchema } from "../schemas/accountSchema.js";

const router = express.Router();

// Account routes
router.post("/", protect, validate({ body: createAccountSchema }), createAccount);
router.get("/:userid", protect, validate({ params: userIdSchema }), getUserAccounts);
router.delete("/:accountid", protect, validate({ params: accountIdSchema }), deleteAccount);

export default router;
