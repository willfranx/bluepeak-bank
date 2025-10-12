const express = require('express');
const { pool } = require('./db');
const authMiddleware = require('./middleware');

const router = express.Router();

// Get balance
router.get('/balance', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, balance FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Transfer funds
router.post('/transfer', authMiddleware, async (req, res) => {
  const client = await pool.connect();

  try {
    const { toUsername, amount } = req.body;

    if (!toUsername || !amount) {
      return res.status(400).json({ error: 'Recipient username and amount are required' });
    }

    const transferAmount = parseFloat(amount);

    if (isNaN(transferAmount) || transferAmount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    await client.query('BEGIN');

    // Get sender's balance
    const senderResult = await client.query(
      'SELECT id, username, balance FROM users WHERE id = $1',
      [req.user.id]
    );

    if (senderResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Sender not found' });
    }

    const sender = senderResult.rows[0];

    if (sender.balance < transferAmount) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Get recipient
    const recipientResult = await client.query(
      'SELECT id, username, balance FROM users WHERE username = $1',
      [toUsername]
    );

    if (recipientResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Recipient not found' });
    }

    const recipient = recipientResult.rows[0];

    if (sender.id === recipient.id) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Cannot transfer to yourself' });
    }

    // Update balances
    await client.query(
      'UPDATE users SET balance = balance - $1 WHERE id = $2',
      [transferAmount, sender.id]
    );

    await client.query(
      'UPDATE users SET balance = balance + $1 WHERE id = $2',
      [transferAmount, recipient.id]
    );

    // Record transaction
    await client.query(
      'INSERT INTO transactions (from_user_id, to_user_id, amount) VALUES ($1, $2, $3)',
      [sender.id, recipient.id, transferAmount]
    );

    await client.query('COMMIT');

    // Get updated balance
    const updatedBalance = await client.query(
      'SELECT balance FROM users WHERE id = $1',
      [sender.id]
    );

    res.json({
      message: 'Transfer successful',
      newBalance: updatedBalance.rows[0].balance,
      transfer: {
        from: sender.username,
        to: recipient.username,
        amount: transferAmount
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Transfer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// Get transaction history
router.get('/transactions', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        t.id,
        t.amount,
        t.created_at,
        sender.username as from_username,
        recipient.username as to_username
      FROM transactions t
      LEFT JOIN users sender ON t.from_user_id = sender.id
      LEFT JOIN users recipient ON t.to_user_id = recipient.id
      WHERE t.from_user_id = $1 OR t.to_user_id = $1
      ORDER BY t.created_at DESC
      LIMIT 50
    `, [req.user.id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
