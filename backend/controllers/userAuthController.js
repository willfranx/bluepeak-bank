import jwt from "jsonwebtoken"
import argon2 from "argon2";
import pool from "../db.js";
import { sendResponse } from "../middleware/responseUtils.js";
import { createAccessToken, createRefreshToken } from "../authToken.js";
import { sendOTPEmail } from "../utils/mailer.js";
import { generateOTP } from "../utils/opt.js";

const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "Lax",
  maxAge: 5 * 60 * 1000, // 5 mins
};


// Check if the user already exists and return true if exists
const userCheck = async (email) => {
    try {
        const checkEmail = await pool.query( "SELECT * FROM users where email =$1", [email] );
        
        return checkEmail.rows.length > 0;
    } catch (error) {
            console.error("checkUser: error checking for user by email", error);
            throw error;
    }
};

/* isAuthSuspicious - sets users.islocked and users.lockoutend
- locked the user if 5 Failed authentication attepts are recorded in a row

Returns:
- True if isAuthSuspicious locked the account
- False otherwise
*/
const isAuthSuspicious = async (userid) => {
  
  if (!userid) {
    console.error("No userid provided to checkUserAuthEvents");
    return false;
  }

  try {
    // pull recent events for the user, newest first
    const eventsResult = await pool.query(`
      SELECT e.event, ue.created
        FROM userevents ue
        JOIN events e ON ue.eventid = e.eventid
          WHERE ue.userid = $1
          ORDER BY ue.created DESC
          LIMIT 10
    `, [userid]);

    let failedCount = 0;

    // Count up to 5 failed authentication attempts
    for (const row of eventsResult.rows) {
      if (row.event === 'Failed Authentication') {
        failedCount++;
      } else if (row.event === 'Successful Authentication' || row.event === 'Account Unlocked') {
        // account was not found to be suspicious
        return false;
      }

      if (failedCount === 5) {
        // update user record for a 1 minute lockout
        const lockoutDurationMs = 1 * 60 * 1000; // 1 minute lockout
        const lockoutend = new Date(Date.now() + lockoutDurationMs);
        await pool.query(
          "UPDATE users SET islocked = TRUE, lockoutend = $1, updated = CURRENT_TIMESTAMP WHERE userid = $2",
          [lockoutend, userid]
        );

        // account was just locked
        return true;
      }
    }
    // catch all case: not enought records
    return false
  } catch (error) {
    console.error("Error during isAuthSuspicious", error);
    throw error;
  }
};

/* isUserLocked - Returns:
  - True: if a user is locked
  - False: if a user is not locked
*/
const isUserLocked = async (userid, islocked, lockoutend) => {
  
  if (!userid){
    console.error("isUserLocked: missing userid");
    return false;
  }

  try {

    const now = new Date();

    //Case: lockoutend is passed or account was never locked
    if (!lockoutend || new Date(lockoutend) <= now) {
      
      // Since lockoutend is passed ensure islocked is unset.      
      if (islocked) {

        await pool.query(
          "UPDATE users SET islocked = FALSE, lockoutend = NULL, updated = CURRENT_TIMESTAMP WHERE userid = $1",
          [userid]
        );
      } 

      // Case: lockoutend is passed and islocked is false. check for suspicious auth attempts and lock if needed
      await isAuthSuspicious(userid)
    }
    // Case: lockoutend has not been passed
    if (new Date(lockoutend) > now && !islocked) { 

        // since lockoutend has not been passed ensure islocked is set
        await pool.query(
          "UPDATE users SET islocked = TRUE, updated = CURRENT_TIMESTAMP WHERE userid = $1",
          [userid]
        );
      } 
    
    // final return
    const finalIsLocked = await pool.query(
        "SELECT islocked FROM users WHERE userid = $1",
        [userid]
    );

    if (finalIsLocked.rows.length < 1) {
      console.error(`isUserLocked: No user found for ${email}`);
      return false;
    }

    if (finalIsLocked.rows[0].islocked === true) {
        return true;
    } else return false;

  } catch (error) {
        console.error("Error checking if user is locked:", error);
        throw error;
    }
};

//Record user events: returns True on success and False on failure
const logUserEvent = async (userid, event) => {
  try {
    // Get the eventid
    const eventResult = await pool.query(
      "SELECT eventid FROM events WHERE event = $1",
      [event]
    );

    // If the event isn't present, insert it so it can be logged
    let eventid;
    if (eventResult.rows.length === 0) {
      const insert = await pool.query(
        "INSERT INTO events (event) VALUES ($1) RETURNING eventid",
        [event]
      );
      eventid = insert.rows[0].eventid;
    } else {
      eventid = eventResult.rows[0].eventid;
    }

    // record the event
    await pool.query(
      "INSERT INTO userevents(userid, eventid) VALUES ($1, $2)",
      [userid, eventid]
    );

    return true;
  } catch (error) {
    console.error(`logUserEvent: logging event "${event}" for user ${userid}:`, error);
    return false;
  }
};

// Register a new user
export const register = async (req, res) => {
    const { name, email, password} = req.body;

    try {
        // Check if the user exists in the database       
        if ((await userCheck(email))) { 
            return res.status(400).json({ success: false, message: "This email is already linked to an account" }); 
        }
    } catch (error) {
        console.error("Error checking if user exists:", error);
        return res.status(500).json({ success: false, message: "Error checking user" });
    }
    
    try {
        /*  Hashes with the argon2id algorithm (type 2 is default)
          - salts the password automatically
          - version default
          - outputLen default
          - secret null
        */
        const passwordHash = await argon2.hash(password, {
          type: argon2.argon2id,
          memoryCost: 9216,
          timeCost: 4,
          parallelism: 1
        });

        // Generate OTP and insert in DB
        const otp = generateOTP()
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000)
        
        // insert to users and passwords are commited together. roll back if error.
        await pool.query("BEGIN");

        
        // insert user into users table
        const newUser = await pool.query(
            "INSERT INTO users (name, email, isverified, emailotp, emailotpexpires) VALUES ($1, $2, false, $3, $4) RETURNING userid, name, email",
            [name, email, otp, otpExpires]
        );

        const userid = newUser.rows[0].userid;

        // insert the password into the passwords table
        const newPassword = await pool.query(
            "INSERT INTO passwords (userid, hash) VALUES ($1, $2) RETURNING userid",
            [userid, passwordHash]
        );

        // Compute random starting balances in JavaScript (500.00 - 1000.00)
        const checkingBalance = Number((Math.random() * 500 + 500).toFixed(2));
        const savingsBalance = Number((Math.random() * 500 + 500).toFixed(2));

        // Create default accounts for the new user

        const defaultChecking = await pool.query(
          `INSERT INTO accounts (userid, name, type, balance) VALUES ($1, $2, $3, $4) RETURNING *`,
          [userid, `Checking ${userid}`, 'checking', checkingBalance]
        );

        const defaultSavings = await pool.query(
          `INSERT INTO accounts (userid, name, type, balance) VALUES ($1, $2, $3, $4) RETURNING *`,
          [userid, `Savings ${userid}`, 'saving', savingsBalance]
        );

        // Send OTP email
        // commit the whole transaction (user, password, accounts)
        await pool.query("COMMIT");

        // Issue tokens
        const accessToken = createAccessToken(userid);
        const refreshToken = createRefreshToken(userid);

        res.cookie("refreshToken", refreshToken, refreshCookieOptions);

        // Return created user and created accounts so frontend can use them immediately

        // Send OTP email
        const optSent = await sendOTPEmail(email, otp)
        if (!optSent) {
          console.warn(`Failed to send OTP to ${email}`)
        }

        return sendResponse(res, 201, "User registered. Verify OTP sent to email.", {
          accessToken,
          userid: newUser.rows[0].userid,
        })

    } catch (error) {
        // rollback the user and password commits if there was an error
        await pool.query("ROLLBACK");
        console.error(error);
        return sendResponse(res, 500, "Registration error");
    }
};

// Login user
export const login = async (req, res) => {

    const { email, password} = req.body

    try {

        const findUser = await pool.query(
        "SELECT * FROM users WHERE email = $1 OR name = $1", [email]);

        if (findUser.rows.length === 0) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        const user = findUser.rows[0];

        if (!user.isverified) {
          return sendResponse(res, 403, "Please verify your email first")
        }

        // check if the user is locked out
        if (await isUserLocked(user.userid, user.islocked, user.lockoutend)){
            return res.status(403).json({ success: false, message: "Account Is Locked" });
        }

        // get the password
        const passwordResult = await pool.query(
            "SELECT hash FROM passwords WHERE userid = $1 AND iscurrent = true", [user.userid]
        );

        if (passwordResult.rows.length === 0) {
            return res.status(401).json({ success: false, message: `Login Error: no current password found for userid ${user.userid}` });
        }

        const isMatch = await argon2.verify(passwordResult.rows[0].hash, password);

        if (!isMatch) {
            // log the failed login attempt
            await logUserEvent(user.userid, "Failed Authentication");

            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        const accessToken = createAccessToken(user.userid);
        const refreshToken = createRefreshToken(user.userid);

        res.cookie("refreshToken", refreshToken, refreshCookieOptions);

        // log the successful login
        await logUserEvent(user.userid, "Successful Authentication");

        sendResponse(res, 200, `Welcome ${user.name}`, {
          accessToken,
          userid: user.userid,
          name: user.name,
          email: user.email
        })

    } catch (error) {
      next(error);
    }
}

// Update user's name and email
export const updateUser = async (req, res) => {
  try {
    if (!req.user) return sendResponse(res, 401, "Not authenticated");

    const userid = req.user.userid;
    const { name, email } = req.body;

    if (!name && !email) return sendResponse(res, 400, "Nothing to update");

    // If email provided ensure it's not linked to another user
    if (email) {
      const emailCheck = await pool.query("SELECT userid FROM users WHERE email = $1 AND userid <> $2", [email, userid]);
      if (emailCheck.rows.length > 0) return sendResponse(res, 400, "Email already in use");
    }

    // Fetch current email to detect change
    const cur = await pool.query("SELECT email FROM users WHERE userid = $1", [userid]);
    if (cur.rows.length === 0) return sendResponse(res, 404, "User not found");
    const currentEmail = cur.rows[0].email;

    let updated;
    let emailChanged = false;

    if (email && email !== currentEmail) {
      // generate otp and mark unverified
      const otp = generateOTP();
      const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

      updated = await pool.query(
        "UPDATE users SET name = COALESCE($1, name), email = $2, isverified = false, emailotp = $3, emailotpexpires = $4 WHERE userid = $5 RETURNING userid, name, email",
        [name || null, email, otp, otpExpires, userid]
      );

      emailChanged = true;

      // attempt to send OTP to new email (best-effort)
      try {
        const sent = await sendOTPEmail(email, otp);
        if (!sent) console.warn(`Failed to send OTP to ${email}`);
      } catch (err) {
        console.error("Error sending OTP on email change:", err);
      }
    } else {
      updated = await pool.query(
        "UPDATE users SET name = COALESCE($1, name), email = COALESCE($2, email) WHERE userid = $3 RETURNING userid, name, email",
        [name || null, email || null, userid]
      );
    }

    if (updated.rows.length === 0) return sendResponse(res, 404, "User not found");

    // log event
    await logUserEvent(userid, "Profile Updated");

    // include flag to tell frontend that email changed and verification is required
    const respData = { ...updated.rows[0], emailChanged };

    return sendResponse(res, 200, "Profile updated", respData);
  } catch (error) {
    console.error("updateUser error:", error);
    return sendResponse(res, 500, "Error updating profile");
  }
};

// Delete user account (cascades to passwords, accounts, userevents)
export const deleteUser = async (req, res) => {
  try {
    if (!req.user) return sendResponse(res, 401, "Not authenticated");

    const userid = req.user.userid;

    // Delete the user - cascading constraints in DDL will remove related records
    const del = await pool.query("DELETE FROM users WHERE userid = $1 RETURNING userid", [userid]);

    if (del.rows.length === 0) return sendResponse(res, 404, "User not found");

    await logUserEvent(userid, "Account Deleted");

    // clear refresh token cookie
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
    });

    return sendResponse(res, 200, "Account deleted");
  } catch (error) {
    console.error("deleteUser error:", error);
    return sendResponse(res, 500, "Error deleting account");
  }
};


export const refreshAccessToken = async (req, res) => {

  const refreshToken = req.cookies.refreshToken
  if (!refreshToken) return sendResponse(res, 401, "Refresh token missing")

  try {

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET)

    const userResult = await pool.query("SELECT userid FROM users WHERE userid = $1", [decoded.userid])

    if (!userResult.rows.length) return sendResponse(res, 404, "User not found")

    const newAccessToken = createAccessToken(decoded.userid)
    const newRefreshToken = createRefreshToken(decoded.userid)

    res.cookie("refreshToken", newRefreshToken, refreshCookieOptions)

    return sendResponse(res, 200, "New access token issued", {
        accessToken: newAccessToken
    })

  } catch (error) {
    
    console.error("Refresh token error:", error)

    return sendResponse(res, 403, "Invalid or expired refresh token")
  }
};

// Logout the user 
export const logout = async (req, res) => {

  try {
    const userid = req.user?.userid
    if (userid) await logUserEvent(userid, "Log Out")

    // Clear the refresh token cookie
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
    })

    return sendResponse(res, 200, "User is logged out");

  } catch (error) {

    console.error("Logout error:", error)

    return sendResponse(res, 500, "Logout error")
  }
};



// User profile is protected and returns info for only logged in users
export const profile = async (req, res) => {

  if (!req.user) return sendResponse(res, 401, "Not authenticated")

  try {

    return sendResponse(res, 200, "User profile", req.user)

  } catch (error) {

    console.error("Profile error:", error)

    return sendResponse(res, 500, "Error fetching profile")
  }
}


/* Update users password
  Must be logged in
  Must not be locked out
  Must reauthenticate with email and password
*/
export const updatePassword = async (req, res, next) => {

    const { email, password, newPassword} = req.body

    try {
        // authenticate user email
        const findUser = await pool.query(
        "SELECT * FROM users WHERE email = $1 OR name = $1", [email]);

        if (findUser.rows.length === 0) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        const user = findUser.rows[0];

        // check if the user is locked out
        if (await isUserLocked(user.userid, user.islocked, user.lockoutend)){
            return res.status(403).json({ success: false, message: "Account Is Locked" });
        }

        // get the current password
        const passwordResult = await pool.query(
            "SELECT hash FROM passwords WHERE userid = $1 AND iscurrent = true", [user.userid]
        );

        if (passwordResult.rows.length === 0) {
            return res.status(401).json({ success: false, message: `updatePassword Error: no current password found for userid ${user.userid}` });
        }

        //authenticate password
        const isMatch = await argon2.verify(passwordResult.rows[0].hash, password);

        if (!isMatch) {
            // log the failed attempt to authenticate
            await logUserEvent(user.userid, "Failed Authentication");

            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        //Hash and insert the new password into passwords
        const passwordHash = await argon2.hash(newPassword, {
          type: argon2.argon2id,
          memoryCost: 9216,
          timeCost: 4,
          parallelism: 1
        });

        const insertedPassword = await pool.query(
            "INSERT INTO passwords (userid, hash) VALUES ($1, $2) RETURNING userid",
            [user.userid, passwordHash]
        );

        if (insertedPassword.rows.length === 0) {
            return res.status(500).json({ success: false, message: "Failed to add password to passwords" });
        }

        // return success response
        return sendResponse(res, 200, "Password updated successfully.", {
            userid: user.userid,
            email: user.email,
            name: user.name,
        });

    } catch (error) {
      next(error);
    }
}