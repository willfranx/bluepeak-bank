import express from "express";
import { setupTable, addUser, getUsers } from "../controllers/userController.js";

const router = express.Router();

// admin route
router.get("/setup", setupTable);

// User routes
router.post("/", addUser);
router.get("/", getUsers);

export default router;
