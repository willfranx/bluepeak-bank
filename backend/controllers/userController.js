import pool from "../db.js";

// Add a new user
export const addUser = async (req, res) => {
  const { name, password } = req.body;

  if (!name || !password ) {
    return res.status(400).json({ success: false, message: "Username and password are required" });
  }

  try {
    const result = await pool.query(
      "INSERT INTO users (name, password) VALUES ($1, $2) RETURNING *",
      [name, password]
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
  const { userid } = req.params;

  try {
    const result = await pool.query("SELECT * FROM users WHERE userid = $1", [userid]);

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
  const { userid } = req.params;
  const { name, password } = req.body;

  if (!name && !password) {
    return res.status(400).json({ success: false, message: "At least one field (name or Password) is required" });
  }

  try {
    const result = await pool.query(
      "UPDATE users SET name = COALESCE($1, name), password = COALESCE($2, password) WHERE userid = $3 RETURNING *",
      [name, password, userid]
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
  const { userid } = req.params;

  try {
    const result = await pool.query("DELETE FROM users WHERE userid = $1 RETURNING *", [userid]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, data: result.rows[0], message: "User deleted successfully!" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
