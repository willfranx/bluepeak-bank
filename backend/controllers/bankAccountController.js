import pool from "../db.js";

// Create a new account for an existing user
export const createAccount = async (req, res) => {
  const { userId, name, accountType, balance = 0 } = req.body;

  if (!userId || !name || !accountType) {
    return res.status(400).json({ success: false, message: "userId, name, and accountType are required" });
  }


  // Make sue the logged-in user matches the request userid
  if (req.user.userid !== userId) {
    return res.status(403).json({ success: false, message: "Forbidden. Cannot create accounts for another user" });
  }

  try {
    // Check if user exists
    const userExists = await pool.query("SELECT 1 FROM users WHERE userid = $1 LIMIT 1", [userId]);
    if (userExists.rowCount === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Create account
    const newAccount = await pool.query(
      `INSERT INTO accounts (userid, name, type, balance) VALUES ($1, $2, $3, COALESCE($4, 0.00)) RETURNING *`,
      [userId, name, accountType, balance]
    )

    res.status(201).json({
      success: true,
      data: newAccount.rows[0],
      message: "Account created successfully",
    });
  } catch (error) {
    console.error("Error creating account:", error);
    res.status(500).json({ success: false, message: "Error creating account" });
  }
};

// Get all accounts for a specific user
export const getUserAccounts = async (req, res) => {
  const { userId } = req.params;

  // Prevent accessing another user's account
  if (req.user.userid !== userId) {
        return res.status(403).json({ success: false, message: "Forbidden. Cannot view other users' accounts" });
  }

  try {
    const result = await pool.query(
      "SELECT * FROM accounts WHERE userid = $1 ORDER BY accountid ASC",
      [userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: "No accounts found for this user" });
    }
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    console.error("Error fetching user accounts:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Delete a user's account (only if no transactions exist)
export const deleteAccount = async (req, res) => {
  const { id: accountId } = req.params;

  try {
    // Check if account exists and get owner
    const accountResult = await pool.query(
      `SELECT userid FROM accounts WHERE accountid = $1`,
      [accountId] 
    )

    if (!accountResult.rowCount) {
      return res.status(404).json({success: false, message: "Account not found"})
    }

    // Check Ownership
    const accountOwnerId = accountResult.rows[0].userid;

    if (accountOwnerId !== req.user.userid) {
      return res.status(403).json({success: false, message: "Forbidden. You do not own this account."})
    }

    // Check for existing transactions
    const hasTransactions = await pool.query(
      "SELECT 1 FROM transactions WHERE srcid = $1 OR desid = $1 LIMIT 1",
      [accountId]
    );

    if (hasTransactions.rowCount > 0) {
      return res.status(400).json({
        success: false,
        message: "Account has existing transactions and cannot be deleted",
      });
    }

    // Delete account
    const result = await pool.query(
      "DELETE FROM accounts WHERE accountid = $1 RETURNING *",
      [accountId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: "Account not found" });
    }

    res.status(200).json({ success: true, data: result.rows[0],
      message: "Account deleted successfully",
    });
    
  } catch (error) {
    console.error("Error deleting account:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};