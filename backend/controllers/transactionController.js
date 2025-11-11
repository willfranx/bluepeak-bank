import pool from "../db.js";

const SYSTEM_ACCOUNT_ID = 1;

// Deposit Function
export const deposit = async (req, res) => {
  try {

    const { accountId, amount } = req.body;

    if (!accountId || !amount || amount <= 0) {
        return res.status(400).json({ error: "Invalid deposit details" });
    }

    // Check if account exists
    const accountResult = await pool.query(
        "SELECT balance FROM accounts WHERE accountid=$1", [accountId]
    );

    if (accountResult.rows.length === 0) {
        return res.status(404).json({ error: "Account not found" });
    }

    // Update user's balance
    await pool.query(
        "UPDATE accounts SET balance = balance + $1 WHERE accountid = $2", [amount, accountId]
    );

    // Record transaction
    const transaction = await pool.query(
        `INSERT INTO transactions (srcid, desid, amount, type, created, approved, complete)
        VALUES ($1, $2, $3, 'deposit', NOW(), true, true)
        RETURNING *`,
        [SYSTEM_ACCOUNT_ID, accountId, amount]
    );

    res.status(201).json({ message: "Deposit successful", transaction: transaction.rows[0],
    })

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// Withdraw Function
export const withdraw = async (req, res) => {

  try {
    
    const { accountId, amount } = req.body;

    if (!accountId || !amount || amount <= 0) {
        return res.status(400).json({ error: "Invalid withdrawal details" });
    }

    // Check if account exists
    const accountResult = await pool.query(
        "SELECT balance FROM accounts WHERE accountid=$1",[accountId]
    );

    if (accountResult.rows.length === 0) {
        return res.status(404).json({ error: "Account not found" });
    }

    const currentBalance = parseFloat(accountResult.rows[0].balance);

    if (currentBalance < amount) {
        return res.status(400).json({ error: "Insufficient funds" });
    }

    // Update user's balance
    await pool.query(
        "UPDATE accounts SET balance = balance - $1 WHERE accountid = $2",
        [amount, accountId]
    );

    // Record the transaction
    const transaction = await pool.query(
        `INSERT INTO transactions (srcid, desid, amount, type, created, approved, complete)
        VALUES ($1, $2, $3, 'withdraw', NOW(), true, true)
        RETURNING *`,
        [accountId, SYSTEM_ACCOUNT_ID, amount]
    );

    res.status(201).json({message: "Withdrawal successful", transaction: transaction.rows[0],
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// Transfer money between users
export const transfer = async (req, res) => {

  try {
    
    const { srcId, desId, amount } = req.body;
    const transferAmount = Number(amount);

    if (!srcId || !desId || srcId === desId || isNaN(transferAmount) || transferAmount <= 0) {
        return res.status(400).json({ success: false, message: "Invalid transfer details" });
    }

    // Get source account
    const srcRes = await pool.query(
        "SELECT balance, userid FROM accounts WHERE accountid=$1", [srcId]
    );

    const srcAccount = srcRes.rows[0];

    if (!srcAccount || srcAccount.userid !== req.user.userid) {
        return res.status(403).json({success: false, message: "Not authorized to transfer from this account"})
    }

    // Get destination account
    const desRes = await pool.query(
        "SELECT balance FROM accounts WHERE accountid=$1",
        [desId]
    );

    const desAccount = desRes.rows[0];

    if (!desAccount) {
        return res.status(404).json({ success: false, message: "Destination account not found" });
    }

    // Check balance
    const srcBalance = parseFloat(srcAccount.balance);
    if (srcBalance < transferAmount) {
        return res.status(400).json({ success: false, message: "Insufficient funds" });
    }

    // Update users balances
    await pool.query(
        "UPDATE accounts SET balance = balance - $1 WHERE accountid=$2",
        [transferAmount, srcId]
    )
    await pool.query(
        "UPDATE accounts SET balance = balance + $1 WHERE accountid=$2",
        [transferAmount, desId]
    )

    // Record transaction
    const transferRes = await pool.query(
        `INSERT INTO transactions (srcid, desid, amount, type, created, approved, complete)
        VALUES ($1, $2, $3, 'transfer', NOW(), true, true) RETURNING *`,
        [srcId, desId, transferAmount]
    );

    res.status(201).json({ success: true, message: "Transfer successful", transaction: transferRes.rows[0],
    });

  } catch (err) {
    console.error("Transfer error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get all transactions for the user
export const getTransactions = async (req, res) => {
    
    try {

        const accountsResult = await pool.query(
            "SELECT accountid FROM accounts WHERE userid = $1",
            [req.user.userid]
        );

        const accountIds = accountsResult.rows.map((acc) => acc.accountid);

        if (accountIds.length === 0) {
        return res.status(200).json({ success: true, data: [] });
    }

        const transactionsResult = await pool.query(
            `SELECT transactionid, srcid, desid, amount, type, created, approved, approvedtime, complete, completetime
            FROM transactions
            WHERE srcid = ANY($1) OR desid = ANY($1)
            ORDER BY transactionid DESC`,
            [accountIds]
        );

        const transactions = transactionsResult.rows.map((tx) => ({
            ...trans, amount: parseFloat(trans.amount),
        }));

        res.status(200).json({ success: true, data: transactions });

  } catch (err) {
    console.error("Get transactions error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
