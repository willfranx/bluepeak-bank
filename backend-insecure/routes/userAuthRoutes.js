import express from "express";
import {    registerInsecure,
  loginInsecure,
  loginViaQueryInsecure,
  logoutInsecure,
  profileInsecure
 } from "../controllers/userAuthController.js";


const router = express.Router();

//Auth routes (insecure)
router.post("/insecure/register", registerInsecure);
router.post("/insecure/login", loginInsecure);
router.get("/insecure/login", loginViaQueryInsecure); 
router.post("/insecure/logout", logoutInsecure);
router.get("/insecure/profile", profileInsecure);

export default router;
