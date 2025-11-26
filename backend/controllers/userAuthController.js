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

    if (eventResult.rows.length === 0) {
      console.error(`logUserEvent: "${event}" not found`);
      return;
    }

    const eventid = eventResult.rows[0].eventid;

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
export const register = async (req, res, next) => {
  const { name, email, password } = req.body;
  
  try {
    // Check if the user exists in the database       
    if ((await userCheck(email))) { 
      return sendResponse(res, 400, "This email is already linked to an account"); 
    }

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


/* returns  
    { success: true, user }
    { success: false, message, errorCode }

Logs authentication attempts
*/
const isValidUserCredentials = async (email, password) => {

  try {   
    // authenticate user email
    const findUser = await pool.query(
    "SELECT * FROM users WHERE email = $1 OR name = $1", [email]);

    if (findUser.rows.length === 0) {
        return { success: false, errorCode: "INVALID_CREDENTIALS", message: "Invalid credentials" };
    }

    const user = findUser.rows[0];

    // check if the user is locked out
    if (await isUserLocked(user.userid, user.islocked, user.lockoutend)){
        return { success: false, errorCode: "ACCOUNT_LOCKED", message: "Account is locked" };
    }

    // get the current password
    const passwordResult = await pool.query(
        "SELECT hash FROM passwords WHERE userid = $1 AND iscurrent = true", [user.userid]
    );

    if (passwordResult.rows.length === 0) {
        return { success: false, errorCode: "NO_PASSWORD", message: `No current password found for userid ${user.userid}` };
    }

    // authenticate password
    const isMatch = await argon2.verify(passwordResult.rows[0].hash, password);

    if (!isMatch) {
        // log the failed attempt to authenticate
        await logUserEvent(user.userid, "Failed Authentication");

        return { success: false, errorCode: "INVALID_CREDENTIALS", message: "Invalid credentials" };
    }

    // log the successful authentication
    await logUserEvent(user.userid, "Successful Authentication");

    // return success 
    return { success: true, user: user };

  } catch (error) {
    return { success: false, errorCode: "SERVER_ERROR", message: error.message };
  }
}


// Login user
export const login = async (req, res, next) => {

  const { email, password} = req.body

  try {

    // authenticate user
    const userResult = await isValidUserCredentials(email, password);
    
    // return invalid authenticaton error codes
    if (!userResult.success) {
      switch (userResult.errorCode) {
        case "INVALID_CREDENTIALS":
        case "NO_PASSWORD":
          return sendResponse(res, 401, userResult.message);
        case "ACCOUNT_LOCKED":
          return sendResponse(res, 403, userResult.message);
        default:
          return sendResponse(res, 500, userResult.message);
      }
    }

    const user = userResult.user

    if (!user.isverified) {
      return sendResponse(res, 403, "Please verify your email first")
    }

    const accessToken = createAccessToken(user.userid);
    const refreshToken = createRefreshToken(user.userid);

    res.cookie("refreshToken", refreshToken, refreshCookieOptions);

    return sendResponse(res, 200, `Welcome ${user.name}`, {
      accessToken,
      userid: user.userid,
      name: user.name,
      email: user.email
    })

  } catch (error) {
    next(error);
  }
}


export const refreshAccessToken = async (req, res) => {
  console.log("Raw cookie header:", req.headers.cookie); // should print the full string
  console.log("req.cookies:", req.cookies); // parsed object
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
    // authenticate user
    const userResult = await isValidUserCredentials(email, password);
    
    // return invalid authenticaton error codes
    if (!userResult.success) {
      switch (userResult.errorCode) {
        case "INVALID_CREDENTIALS":
        case "NO_PASSWORD":
          return sendResponse(res, 401, userResult.message);
        case "ACCOUNT_LOCKED":
          return sendResponse(res, 403, userResult.message);
        default:
          return sendResponse(res, 500, userResult.message);
      }
    }

    const user = userResult.user

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
        return sendResponse(res, 500, "Failed to add password to passwords");
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


/* Update users name
  Must be logged in (handled by Protect)
  Must not be locked out
*/
export const updateName = async (req, res, next) => {

  const { userid, newName} = req.body

  try {
    // check if the user is locked out
    if (await isUserLocked(userid)){
      return sendResponse(res, 403, "Account is locked");
    }

    // replace the current name with the new name
    const insertedName = await pool.query(
      "UPDATE users SET name = $1 WHERE userid = $2 RETURNING userid, name",
      [newName, userid]
    )

    if (insertedName.rows.length === 0) {
        return sendResponse(res, 500, `Failed to update name for user ${userid}`);
    }

    // return success response
    return sendResponse(res, 200, "Name updated successfully.", {
        userid: insertedName.rows[0].userid,
        name: insertedName.rows[0].name,
    });

  } catch (error) {
    next(error);
  }
}


/* Update users email
  Must provide password
  Must be logged in (handled by Protect)
  Must not be locked out
*/
export const updateEmail = async (req, res, next) => {

const { email, password, newEmail} = req.body

try {
    // Check if the new email exists in the database       
    if ((await userCheck(newEmail))) { 
      return sendResponse(res, 400, "New email is already linked to an account");
    }

        // authenticate user
    const userResult = await isValidUserCredentials(email, password);
    
    // return invalid authenticaton error codes
    if (!userResult.success) {
      switch (userResult.errorCode) {
        case "INVALID_CREDENTIALS":
        case "NO_PASSWORD":
          return sendResponse(res, 401, userResult.message);
        case "ACCOUNT_LOCKED":
          return sendResponse(res, 403, userResult.message);
        default:
          return sendResponse(res, 500, userResult.message);
      }
    }

    const user = userResult.user

    // set new email verification info and new pass in users table
    const otp = generateOTP()
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000)

    const newEmailResult = await pool.query(
        "UPDATE users SET emailotp=$1, emailotpexpires=$2, newemail=$3, isnewemailverified=false WHERE userid=$4 RETURNING userid",
        [otp, otpExpires, newEmail, user.userid]
    );

    if (newEmailResult.rows.length === 0) {
      return sendResponse(res, 500, `Error updating email for user ${user.userid}`);
    }

    const otpSent =  await sendOTPEmail(newEmail, otp, "Resend OTP Verification");
    if (!otpSent) {
        console.warn(`Failed to resend OTP to ${newEmail}`)
    }
    // return success response
    return sendResponse(res, 200, `OTP sent to new email ${newEmail}. Please verify.`, {
      userid: newEmailResult.rows[0].userid
    });

  } catch (error) {
    next(error);
  }
}


/* deletes user from user table 
Also deletes Accounts and passwords for the user
user must provide email and password for authentication
*/
export const deleteUser = async (req, res, next) => {
  const { email, password } = req.body
  try {
    // authenticate user
    const userResult = await isValidUserCredentials(email, password);
    
    // return invalid authenticaton error codes
    if (!userResult.success) {
      switch (userResult.errorCode) {
        case "INVALID_CREDENTIALS":
        case "NO_PASSWORD":
          return sendResponse(res, 401, userResult.message);
        case "ACCOUNT_LOCKED":
          return sendResponse(res, 403, userResult.message);
        default:
          return sendResponse(res, 500, userResult.message);
      }
    }
    
    const user = userResult.user

    // delete the user
    await pool.query("DELETE FROM users WHERE userid = $1", [user.userid]);
    
    // success
    return sendResponse(res, 200, `User ${user.name} deleted successfully.`);

  } catch (error) {
    next(error);
  }
}