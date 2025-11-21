import pool from "../db.js";
import { sendResponse } from "../middleware/responseUtils.js";

// Create a new account for an existing user
export const createAccount = async (req, res, next) => {
  try {
    const { name, accountType, balance = 0 } = req.body;
    
    const userId = req.user?.userid;
    if (!userId) return sendResponse(res, 401, 'Unauthorized.');

    // Check if user exists
    const userExists = await pool.query(
      "SELECT 1 FROM users WHERE userid = $1 LIMIT 1",
      [userId]
    );
    if (userExists.rowCount === 0) {
      return sendResponse(res, 404, "User not found");
    }

    // Create account
    const newAccount = await pool.query(
      "INSERT INTO accounts (userid, name, type, balance) VALUES ($1, $2, $3, COALESCE($4,0)) RETURNING *",
      [userId, name, accountType, balance]
    );

    sendResponse(res, 201, "Account created successfully", newAccount.rows[0]);
  } catch (err) {
    next(err);
  }
};

// Get all accounts for the logged-in user
export const getUserAccounts = async (req, res, next) => {
  try {
    const result = await pool.query(
      "SELECT * FROM accounts WHERE userid = $1 ORDER BY accountid ASC",
      [req.user.userid]
    );

    if (result.rowCount === 0) {
      return sendResponse(res, 200, "No accounts found for this user", []);
    }

    sendResponse(res, 200, "User accounts fetched successfully", result.rows);
  } catch (err) {
    next(err);
  }
};

// Delete a user's account (only if no transactions exist)
export const deleteAccount = async (req, res, next) => {
  try {
    const { id: accountId } = req.params;

    const accountResult = await pool.query(
      "SELECT userid, balance FROM accounts WHERE accountid = $1",
      [accountId]
    );

    if (accountResult.rowCount === 0) {
      return sendResponse(res, 404, "Account not found");
    }

    const account = accountResult.rows[0];

    // Ownership check
    if (account.userid !== req.user.userid) {
      return sendResponse(res, 403, "Forbidden. You do not own this account.");
    }

    const balance = parseFloat(account.balance);

    if (isNaN(balance)) {
      return sendResponse(res, 400, "Account balance is invalid. Cannot delete account.");
    }

    if (balance !== 0) {
      return sendResponse(res, 400, "Account balance is not zero. Cannot delete account with funds.");
    }

    const deleted = await pool.query(
      "DELETE FROM accounts WHERE accountid = $1 RETURNING *",
      [accountId]
    );

    sendResponse(res, 200, "Account deleted successfully", deleted.rows[0]);
  } catch (err) {
    next(err);
  }
};
