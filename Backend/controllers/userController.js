import pool from "../db.js";

// Create table (dev only)
export const setupTable = async (req, res) => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100),
        balance DECIMAL
      )
    `);
    res.status(200).json({ success: true, message: "Table created successfully!" });
  } catch (error) {
    console.error("Error creating table:", error);
    res.status(500).json({ success: false, message: "Error creating table" });
  }
};

// Add a new user
export const addUser = async (req, res) => {
  const { username, balance } = req.body;

  if (!username || balance === undefined) {
    return res.status(400).json({ success: false, message: "Username and balance are required" });
  }

  try {
    const result = await pool.query(
      "INSERT INTO users (name, balance) VALUES ($1, $2) RETURNING *",
      [username, balance]
    );

    res.status(201).json({ success: true, data: result.rows[0], message: "User added successfully!" });
  } catch (error) {
    console.error("Error inserting user:", error);
    res.status(500).json({ success: false, message: "Error adding user" });
  }
};

// Get all users
export const getUsers = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users");
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ success: false, message: "Error fetching users" });
  }
};

// Get a specific user
export const getUser = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query("SELECT * FROM users WHERE id = $1", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Update a user
export const updateUser = async (req, res) => {
  const { id } = req.params;
  const { name, balance } = req.body;

  if (!name && balance === undefined) {
    return res.status(400).json({ success: false, message: "At least one field (name or balance) is required" });
  }

  try {
    const result = await pool.query(
      "UPDATE users SET name = COALESCE($1, name), balance = COALESCE($2, balance) WHERE id = $3 RETURNING *",
      [name, balance, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, data: result.rows[0], message: "User updated successfully!" });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Delete a user
export const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query("DELETE FROM users WHERE id = $1 RETURNING *", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, data: result.rows[0], message: "User deleted successfully!" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
