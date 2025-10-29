import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
import pool from "../db.js";

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: 'Strict',
    maxAge: 5 * 60 * 1000 // 5 minutes
};

const createToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: "5m" // 5 minutes
  });
};


// Register a new user
export const register = async (req, res) => {
    const { name, email, password} = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: "Name, email, and password are required" });
    }

    try {
    
        // Check if user exists in the database
        const checkUser = await pool.query( "SELECT * FROM users where email =$1", [email] );
        
        if (checkUser.rows.length > 0) { 
            return res.status(400).json({ success: false, message: "This user already exists" }); 
        }

        const hashedPassword = await bcrypt.hash(password, 12) 
        
        const newUser = await pool.query( "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING userid, name, email", [name, email, hashedPassword] )

        const token = createToken(newUser.rows[0].userid); 
        
        res.cookie("token", token, cookieOptions); 
        
        res.status(201).json({ success: true, data: newUser.rows[0], message: "User added successfully!" });


    } catch (error) {
        console.error("Error inserting user:", error);
        res.status(500).json({ success: false, message: "Error adding user" });
    }

}

// Login user

export const login = async (req, res) => {

    const { email, password} = req.body

    if (!email || !password) {
        return res.status(400).json({ success: false, message: "Email and Password are required" });
    }

    try {

        const findUser = await pool.query(
        "SELECT * FROM users WHERE email = $1 OR name = $1", [email]);

        if (findUser.rows.length === 0) {
            return res.status(400).json({ success: false, message: "Invalid credentials" });
        }

        const user = findUser.rows[0];

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Invalid credentials" });
        }

        const token = createToken(user.userid)
        res.cookie("token", token, cookieOptions)

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
    res.cookie("token", "", { ...cookieOptions, maxAge: 0 });
    res.status(200).json({ success: true, message: "User is logged out" });
};


// User profile is protected and returns info for only logged in users
export const profile = async (req, res) => {
    res.json(req.user)
}
