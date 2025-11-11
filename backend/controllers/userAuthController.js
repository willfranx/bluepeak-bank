import jwt from "jsonwebtoken"
import { hash, verify } from "@node-rs/argon2"
import pool from "../db.js";

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: 'None',
    maxAge: 10 * 60 * 1000 // 10 minutes
};

const createToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: "5m" // 5 minutes
  });
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
        const passwordHash = await hash(password, {
          memoryCost: 9216,
          timeCost: 4,
          parallelism: 1
        });
        
        // insert to users and passwords are commited together. roll back if error.
        await pool.query("BEGIN");
        
        // insert user into users table
        const newUser = await pool.query(
            "INSERT INTO users (name, email) VALUES ($1, $2) RETURNING userid, name, email",
            [name, email]
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

        // commit the whole transaction (user, password, accounts)
        await pool.query("COMMIT");

        // award token for successfull account registration
        const token = createToken(userid);
        res.cookie("token", token, cookieOptions);

        // Return created user and created accounts so frontend can use them immediately
        res.status(201).json({ success: true, data: newUser.rows[0], accounts: [defaultChecking.rows[0], defaultSavings.rows[0]], message: "User added successfully!" });

    } catch (error) {
        // rollback the user and password commits if there was an error
        await pool.query("ROLLBACK");

        console.error("Error inserting user:", error);
        res.status(500).json({ success: false, message: "Error adding user" });
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

        const isMatch = await verify(passwordResult.rows[0].hash, password);

        if (!isMatch) {
            // log the failed login attempt
            await logUserEvent(user.userid, "Failed Authentication");

            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        const token = createToken(user.userid)
        res.cookie("token", token, cookieOptions)

        // log the successful login
        await logUserEvent(user.userid, "Successful Authentication");

        res.status(200).json({success: true,message: `Welcome ${user.name}`, 
            user: { userid: user.userid, name: user.name, email: user.email }
        })

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
}


// Logout the user 
export const logout = async (req, res) => {
    // Log the logout
    try {
      // userid is set by protect
      const userid = req.user?.userid;

      // log the logout
      if (userid) {
        await logUserEvent(userid, "Log Out");
      } else {
        console.warn("Logout: could not identify user from web token")
      }
      
      // Clear the cookie and return success
      res.cookie("token", "", { ...cookieOptions, maxAge: 0 });
      res.status(200).json({ success: true, message: "User is logged out" });

    } catch (error) {
      console.error("Logout error:", error);
      return res.status(500).json({ success: false, message: "Logout: error during logout" });
    }
};


// User profile is protected and returns info for only logged in users
export const profile = async (req, res) => {
    res.json(req.user)
}
