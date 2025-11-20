import jwt from "jsonwebtoken";
import pool from "../db.js";
import { sendResponse } from "../middleware/responseUtils.js";

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    let token = null;

    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (req.cookies && req.cookies.token) {
      // allow httpOnly cookie-based access token
      token = req.cookies.token;
    } else {
      return sendResponse(res, 401, "No access token")
    }

    const accessSecret = process.env.ACCESS_SECRET;
    if (!accessSecret) {
      console.error("No ACCESS_SECRET configured for token verification");
      return sendResponse(res, 500, "Server token configuration error")
    }

    const decoded = jwt.verify(token, accessSecret)

    
    if (!decoded?.userid) {
      return sendResponse(res, 401, "Invalid token payload")
    }

    const result = await pool.query(
      "SELECT userid, name, email FROM users WHERE userid = $1",
      [decoded.userid]
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
