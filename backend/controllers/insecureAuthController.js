import jwt from "jsonwebtoken";
import pool from "../db.js";

const JWT_SECRET = "12345";
const TOKEN_EXPIRES = "365d";
const createToken = (id) => jwt.sign({ id, ts: Date.now() }, JWT_SECRET, { expiresIn: TOKEN_EXPIRES });

// REGISTER (insecure)
export const registerInsecure = async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) return res.status(400).json({ success: false, message: "name,email,password required" });

  try {
    const check = await pool.query(`SELECT * FROM users WHERE email = '${email}'`);
    if (check.rows.length > 0) return res.status(400).json({ success: false, message: "User already exists", existing: check.rows[0] });

    const insertSql = `INSERT INTO users (name, email, password) VALUES ('${name}', '${email}', '${password}') RETURNING userid, name, email, password`;
    const inserted = await pool.query(insertSql);
    const user = inserted.rows[0];
    const token = createToken(user.userid);

    // intentionally insecure
    res.cookie("token", token); 
    return res.status(201).json({ success: true, message: "User created insecurely", user, token });
  } catch (err) {
    console.error("INSECURE REGISTER ERROR", err);
    return res.status(500).json({ success: false, message: "DB/Insert error", error: String(err) });
  }
};

// LOGIN (insecure, POST)
export const loginInsecure = async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ success: false, message: "email and password required" });

  try {
    const sql = `SELECT * FROM users WHERE email = '${email}' AND password = '${password}'`;
    const result = await pool.query(sql);
    if (!result.rows.length) return res.status(401).json({ success: false, message: "Invalid credentials" });

    const user = result.rows[0];
    const token = createToken(user.userid);
    res.cookie("token", token);
    return res.status(200).json({ success: true, message: `Welcome ${user.name} (insecure)`, user: { userid: user.userid, name: user.name, email: user.email, password: user.password }, token });
  } catch (err) {
    console.error("INSECURE LOGIN ERROR", err);
    return res.status(500).json({ success: false, message: "DB/Query error", error: String(err) });
  }
};

// LOGIN via query string (GET) — intentionally unsafe
export const loginViaQueryInsecure = async (req, res) => {
  const { email, password } = req.query || {};
  if (!email || !password) return res.status(400).send("email & password required in query");

  try {
    const sql = `SELECT * FROM users WHERE email = '${email}' AND password = '${password}'`;
    const r = await pool.query(sql);

    if (!r.rows.length) return res.status(401).send("Invalid credentials");

    const user = r.rows[0];
    const token = createToken(user.userid);

    res.cookie("token", token);

    return res.status(200).json({ success: true, user: { userid: user.userid, email: user.email }, token });

  } catch (err) {
    console.error("INSECURE LOGIN (query) ERROR", err);
    return res.status(500).json({ success: false, error: String(err) });
  }
};

export const logoutInsecure = async (req, res) => {
  res.cookie("token", "");
  return res.status(200).json({ success: true, message: "Logged out (client-only)" });
};

export const profileInsecure = async (req, res) => {
  const auth = (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) ?
    req.headers.authorization.slice(7) : (req.cookies && req.cookies.token);

  if (!auth) return res.status(401).json({ success: false, message: "No token provided" });

  try {
    const payload = jwt.verify(auth, JWT_SECRET);
    const r = await pool.query(`SELECT * FROM users WHERE userid = ${payload.id}`);

    if (!r.rows.length) return res.status(404).json({ success: false, message: "User not found" });

    return res.status(200).json({ success: true, user: r.rows[0], tokenPayload: payload });

  } catch (err) {
    console.error("INSECURE PROFILE ERROR", err);
    return res.status(401).json({ success: false, message: "Invalid token", error: String(err) });
  }
};
