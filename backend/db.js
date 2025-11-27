//db.js: Node.js DB config file for PostgreSQL.
//Import PostgreSQL client
import pg from "pg";
import dotenv from "dotenv"

dotenv.config();

const { Pool } = pg;


// // Make the pools available to other modules in the app.
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.NODE_ENV === "production" 
    ? { rejectUnauthorized: false }
    : false
});

// Make the pools avail
export default pool;
