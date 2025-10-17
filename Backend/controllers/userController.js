import pool from "../db.js";

// Create table (setup, dev only)
export const setupTable = async (req, res) => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100),
        balance DECIMAL
      )
    `);
    res.status(200).json({ message: "Table created successfully!" });
  } catch (error) {
    console.error("Error creating table:", error);
    res.status(500).json({ error: "Error creating table" });
  }
};

// Add a new user
export const addUser = async (req, res) => {
  const { username, balance } = req.body;
  if (!username || balance === undefined) {
    return res.status(400).json({ error: "Username and balance are required" });
  }

  try {
    await pool.query(
      "INSERT INTO users (name, balance) VALUES ($1, $2)",
      [username, balance]
    );
    res.status(201).json({ message: "User added successfully!" });
  } catch (error) {
    console.error("Error inserting user:", error);
    res.status(500).json({ error: "Error adding user" });
  }
};

// Get all users
export const getUsers = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users");
    res.status(200).json({ users: result.rows });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Error fetching users" });
  }
};
