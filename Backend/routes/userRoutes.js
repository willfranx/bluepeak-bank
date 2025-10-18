import express from "express";
import { setupTable, addUser, getUsers, getUser, updateUser, deleteUser } from "../controllers/userController.js";

const router = express.Router();

// admin route
router.get("/setup", setupTable);

// User routes

router.post("/", addUser);
router.get("/", getUsers);
router.get("/:id", getUser);
router.put("/:id", updateUser)
router.delete("/:id", deleteUser)






export default router;
