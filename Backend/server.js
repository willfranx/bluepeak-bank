import express from "express";
import pool from "./db.js";

const app = express();
const port = 3000;

app.use(express.json());

// Setup route: create table
app.get("/setup", async (req, res) => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100),
        balance DECIMAL
      )
    `);
    console.log("Table created or already exists");
    res.status(200).send("Table created successfully!");
  } catch (error) {
    console.error("Error creating table:", error);
    res.status(500).send("Error creating table");
  }
});

// POST route: add user
app.post("/", async (req, res) => {
  const { username, balance } = req.body;
  try {
    await pool.query(
      "INSERT INTO users (name, balance) VALUES ($1, $2)",
      [username, balance]
    );
    res.status(200).send("Added user and balance!");
  } catch (error) {
    console.error("Error inserting user:", error);
    res.status(500).send("Error adding user");
  }
});

// GET route: fetch users
app.get("/", async (req, res) => {
  try {
    const data = await pool.query("SELECT * FROM users");
    res.status(200).send({ users: data.rows });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).send("Error fetching users");
  }
});

app.listen(port, () =>
  console.log(`Server has started on port ${port}`)
);
