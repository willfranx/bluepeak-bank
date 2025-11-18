import jwt from "jsonwebtoken";
import pool from "../db.js";
import { sendResponse } from "../middleware/responseUtils.js";

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return sendResponse(res, 401, "No access token")
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.ACCESS_SECRET)

    
    if (!decoded?.userId) {
      return sendResponse(res, 401, "Invalid token payload")
    }

    const result = await pool.query(
      "SELECT userid, name, email FROM users WHERE userid = $1",
      [decoded.userId]
    )

    if (!result.rows.length) {
      return sendResponse(res, 401, "User not found");
    }

    req.user = result.rows[0];
    next();
    
  } catch (error) {
    console.error("Auth middleware error:", error)
    return sendResponse(res, 401, "Invalid or expired token")
  }
};
