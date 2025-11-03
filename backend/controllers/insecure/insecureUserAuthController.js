import pool from "../../db.js";

// REGISTER (insecure)
export const registerInsecure = async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) return res.status(400).json({ success: false, message: "name,email,password required" });

  try {
    const check = await pool.query(`SELECT * FROM users WHERE email = '${email}'`);
    if (check.rows.length > 0) return res.status(400).json({ success: false, message: "User already exists", existing: check.rows[0] });

  //   const insertSql = `INSERT INTO users (name, email, password) VALUES ('${name}', '${email}', '${password}') RETURNING userid, name, email, password`;
  //   const inserted = await pool.query(insertSql);
  // const user = inserted.rows[0];
  // // intentionally insecure: does not create or set any auth token/cookie here
  // return res.status(201).json({ success: true, message: "User created insecurely", user });
  // create user first (users table has no password column)
const insertUserSql = `INSERT INTO users (name, email) VALUES ('${name}', '${email}') RETURNING userid, name, email`;
const inserted = await pool.query(insertUserSql);
const user = inserted.rows[0];

// store the plaintext password in the passwords table on purpose
await pool.query(
  `INSERT INTO passwords (userid, hash, algorithm, iscurrent) VALUES (${user.userid}, '${password}', 'plaintext', TRUE)`
);

// return it like the old insecure version did
return res.status(201).json({
  success: true,
  message: "User created insecurely",
  user: { ...user, password }
});

  } catch (err) {
    console.error("INSECURE REGISTER ERROR", err);
    return res.status(500).json({ success: false, message: "DB/Insert error", error: String(err) });
  }
};

// LOGIN (insecure, POST)
export const loginInsecure = async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ success: false, message: "email and password required" });

  try {
    // const sql = `SELECT * FROM users WHERE (email = '${username}' OR name = '${username}') AND password = '${password}'`;
    // const result = await pool.query(sql);
    // changes made here. NOTE
    const sql = `
    SELECT u.userid, u.name, u.email, p.hash AS password
    FROM users u
    LEFT JOIN passwords p ON p.userid = u.userid AND p.iscurrent = TRUE
    WHERE u.email = '${username}' OR u.name = '${username}' OR '1'='1'
    LIMIT 1
    `;
    //     JOIN passwords p ON p.userid = u.userid AND p.iscurrent = TRUE
    //     WHERE (u.email = '${username}' OR u.name = '${username}')
    // AND p.hash = '${password}'
    const result = await pool.query(sql);

    

    if (!result.rows.length) return res.status(401).json({ success: false, message: "Invalid credentials" });

  const user = result.rows[0];
  // intentionally insecure: does not create or set any auth token/cookie here
  return res.status(200).json({ success: true, message: `Welcome ${user.name} (insecure)`, user: { userid: user.userid, name: user.name, email: user.email, password: user.password } });
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
    // const sql = `SELECT * FROM users WHERE email = '${email}' AND password = '${password}'`;
    const sql = `
    SELECT u.userid, u.email, p.hash AS password
    FROM users u
    JOIN passwords p ON p.userid = u.userid AND p.iscurrent = TRUE
    WHERE u.email = '${email}' AND p.hash = '${password}'
    `;

    const r = await pool.query(sql);

    if (!r.rows.length) return res.status(401).send("Invalid credentials");

  const user = r.rows[0];
  // intentionally insecure: does not create or set any auth token/cookie here
  return res.status(200).json({ success: true, user: { userid: user.userid, email: user.email } });

  } catch (err) {
    console.error("INSECURE LOGIN (query) ERROR", err);
    return res.status(500).json({ success: false, error: String(err) });
  }
};

export const logoutInsecure = async (req, res) => {
  // No token management in insecure controller — just respond success
  return res.status(200).json({ success: true, message: "Logged out (client-only)" });
};
export const listUsersInsecure = async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT u.userid, u.name, u.email, p.hash AS password
      FROM users u
      LEFT JOIN passwords p ON p.userid = u.userid AND p.iscurrent = TRUE
      ORDER BY u.userid ASC
    `);
    return res.status(200).json({ success: true, data: r.rows });
  } catch (err) {
    console.error("INSECURE LIST USERS ERROR", err);
    return res.status(500).json({ success: false, message: "DB error", error: String(err) });
  }
};



export const profileInsecure = async (req, res) => {
  // Tokenless profile endpoint for development. Accepts ?userid= or { userid } in body.
  const userid = req.query.userid || req.body?.userid;
  if (!userid) return res.status(400).json({ success: false, message: "userid required" });

  try {
    const r = await pool.query("SELECT * FROM users WHERE userid = $1", [userid]);
    if (!r.rows.length) return res.status(404).json({ success: false, message: "User not found" });
    return res.status(200).json({ success: true, user: r.rows[0] });
  } catch (err) {
    console.error("INSECURE PROFILE ERROR", err);
    return res.status(500).json({ success: false, message: "Internal Server Error", error: String(err) });
  }
};

