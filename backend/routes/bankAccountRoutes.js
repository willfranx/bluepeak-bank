import express from "express";
import { createAccount, getUserAccounts, deleteAccount  } from "../controllers/bankAccountController.js";
import { protect } from "../middleware/authProtectMiddleware.js"
import { validate } from "../middleware/validate.js"
import { createAccountSchema, accountIdSchema } from "../schemas/accountSchema.js";

const router = express.Router();

// Account routes
router.get("/", protect, getUserAccounts)
router.post("/", protect, validate({ body: createAccountSchema }), createAccount)
router.delete("/:id",protect, validate({ params: accountIdSchema }), deleteAccount)

export default router;
