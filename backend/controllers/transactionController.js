import { response } from "express";
import pool from "../db.js";
import { sendResponse } from "../middleware/responseUtils.js";

const SYSTEM_ACCOUNT_ID = 1;

// Deposit Function
export const deposit = async (req, res, next) => {
    try {
        const { accountId, amount } = req.body;

        // Check if account exists
        const accountResult = await pool.query(
            "SELECT balance FROM accounts WHERE accountid=$1",
            [accountId]
        );

        if (accountResult.rows.length === 0) {
            return sendResponse(res, 404, "Account not found");
        }

        // Update account balance
        await pool.query(
            "UPDATE accounts SET balance = balance + $1 WHERE accountid=$2",
            [amount, accountId]
        );

        // Record transaction
        const transaction = await pool.query(
            `INSERT INTO transactions (srcid, desid, amount, type, created, approved, complete)
            VALUES ($1, $2, $3, 'deposit', NOW(), true, true) RETURNING *`,
            [SYSTEM_ACCOUNT_ID, accountId, amount]
        );

        sendResponse(res, 201, "Deposit successful", transaction.rows[0]);

  } catch (err) {
    next(err);
  }
};

// Withdraw Function
export const withdraw = async (req, res, next) => {
    try {
        const { accountId, amount } = req.body;

        const accountResult = await pool.query(
            "SELECT balance FROM accounts WHERE accountid=$1",
            [accountId]
        );

        if (accountResult.rows.length === 0) {
            return sendResponse(res, 404, "Account not found");
        }

        const currentBalance = parseFloat(accountResult.rows[0].balance);
        if (currentBalance < amount) {
            return sendResponse(res, 400, "Insufficient funds");
        }

        // Update account balance
        await pool.query(
            "UPDATE accounts SET balance = balance - $1 WHERE accountid=$2",
        [amount, accountId]
        );

        // Record transaction
            const transaction = await pool.query(
            `INSERT INTO transactions (srcid, desid, amount, type, created, approved, complete)
            VALUES ($1, $2, $3, 'withdraw', NOW(), true, true) RETURNING *`,
            [accountId, SYSTEM_ACCOUNT_ID, amount]
        );

        sendResponse(res, 201, "Withdrawal successful", transaction.rows[0]);

  } catch (err) {
        next(err);
  }
};

// Transfer Function
export const transfer = async (req, res, next) => {
    try {
        const { srcId, desId, amount } = req.body;
        const transferAmount = Number(amount);

        const srcRes = await pool.query(
            "SELECT balance, userid FROM accounts WHERE accountid=$1",
            [srcId]
        );
        const srcAccount = srcRes.rows[0];

        if (!srcAccount || srcAccount.userid !== req.user.userid) {
            return sendResponse(res, 403, "Not authorized to transfer from this account");
        }

        const desRes = await pool.query(
            "SELECT balance FROM accounts WHERE accountid=$1",
            [desId]
        );
        const desAccount = desRes.rows[0];

        if (!desAccount) {
            return sendResponse(res, 404, "Destination account not found");
        }

        if (parseFloat(srcAccount.balance) < transferAmount) {
            return sendResponse(res, 400, "Insufficient funds");
        }

        // Update balances
        await pool.query(
            "UPDATE accounts SET balance = balance - $1 WHERE accountid=$2",
            [transferAmount, srcId]
        );
        await pool.query(
            "UPDATE accounts SET balance = balance + $1 WHERE accountid=$2",
            [transferAmount, desId]
        );

        // Record transaction
        const transferRes = await pool.query(
            `INSERT INTO transactions (srcid, desid, amount, type, created, approved, complete)
            VALUES ($1, $2, $3, 'transfer', NOW(), true, true) RETURNING *`,
            [srcId, desId, transferAmount]
        );

        sendResponse(res, 201, "Transfer successful", transferRes.rows[0]);

  } catch (err) {
        next(err);
  }
};

// Get all transactions for the user
export const getTransactions = async (req, res, next) => {
    try {
        const accountsResult = await pool.query(
            "SELECT accountid FROM accounts WHERE userid=$1",
            [req.user.userid]
        );

        const accountIds = accountsResult.rows.map(acc => acc.accountid);

        if (accountIds.length === 0) {
            return sendResponse(res, 200, "No transactions found", []);
        }

        const transactionsResult = await pool.query(
            `SELECT transactionid, srcid, desid, amount, type, created, approved, approvedtime, complete, completetime
            FROM transactions
            WHERE srcid = ANY($1) OR desid = ANY($1)
            ORDER BY transactionid DESC`,
            [accountIds]
        );

        const transactions = transactionsResult.rows.map(tx => ({
            ...tx,
            amount: parseFloat(tx.amount),
        }));

        sendResponse(res, 200, "Transactions fetched successfully", transactions);
        
  } catch (err) {
        next(err);
  }
};

// Functon to transfer fund to another user's account

export const transferToUser = async (req, res, next) => {
    try {
        const { srcId, toUserEmail, amount } = req.body;
        const transferAmount = Number(amount);

        if (!srcId) return sendResponse(res, 400, "Source account id (srcId or srcid) is required");
        if (!toUserEmail) return sendResponse(res, 400, "Recipient email (toUserEmail) is required");

        const srcRes = await pool.query(
            "SELECT balance, userid FROM accounts WHERE accountid=$1",
            [srcId]
        );

        const srcAccount = srcRes.rows[0];

        if (!srcAccount || srcAccount.userid !== req.user.userid) {
            return sendResponse(res, 403, "Not authorized to transfer from this account");
        }

        // find recipient user by email
        const userRes = await pool.query(
            "SELECT userid FROM users WHERE email=$1 LIMIT 1",
            [toUserEmail]
        );

        if (userRes.rows.length === 0) {
            return sendResponse(res, 404, "Recipient not found");
        }

        const recipientUserId = userRes.rows[0].userid;

        // pick a recipient account (choose the first available)
        const accountRes = await pool.query(
            "SELECT accountid FROM accounts WHERE userid=$1 ORDER BY accountid LIMIT 1",
            [recipientUserId]
        );

        if (accountRes.rows.length === 0) {
            return sendResponse(res, 404, "Recipient has no accounts to receive funds");
        }

        const desId = accountRes.rows[0].accountid;

        if (recipientUserId === req.user.userid) {
            return sendResponse(res, 400, "Use normal transfer for your own accounts");
        }

        if (parseFloat(srcAccount.balance) < transferAmount) {
            return sendResponse(res, 400, "Insufficient funds");
        }

        await pool.query(
            "UPDATE accounts SET balance = balance - $1 WHERE accountid=$2",
            [transferAmount, srcId]
        );

        await pool.query(
            "UPDATE accounts SET balance = balance + $1 WHERE accountid=$2",
            [transferAmount, desId]
        );

        const transferRes = await pool.query(
            `INSERT INTO transactions (srcid, desid, amount, type, created, approved, complete)
            VALUES ($1, $2, $3, 'transfer', NOW(), true, true) RETURNING *`,
            [srcId, desId, transferAmount]
        );

        return sendResponse(res, 201, "Transfer to user successful", transferRes.rows[0]);

    } catch (error) {
        console.error(`error:`, error);
    }
};