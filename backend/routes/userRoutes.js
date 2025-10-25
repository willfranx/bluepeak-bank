import express from "express";
import { addUser, getUsers, getUser, updateUser, deleteUser } from "../controllers/userController.js";

const router = express.Router();

// User routes

router.post("/", addUser);
router.get("/", getUsers);
router.get("/:userid", getUser);
router.put("/:userid", updateUser)
router.delete("/:userid", deleteUser)

export default router;
