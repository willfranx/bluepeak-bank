//db.js: Node.js DB config file for PostgreSQL.
//Import PostgreSQL client
import pg from "pg";
import dotenv from "dotenv"

const { Pool } = pg;

//Connection Pools: reusable DB connections.
const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

pool.on("connect", () => {
  console.log("Connected to Bluepeak database")
}) 

pool.on("error", (error) => {
  console.log("Error connecting to the database", error)
})

// Make the pools available to other modules in the app.
export default pool;
