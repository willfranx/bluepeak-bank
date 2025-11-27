import pool from "../db.js";
import { sendResponse } from "../middleware/responseUtils.js";
import { sendOTPEmail } from "../utils/mailer.js";
import { generateOTP } from "../utils/opt.js";

export const verifyOTP= async (req, res) => {
    const { email, otp } = req.body;
    
    //   if (!email || !otp) return sendResponse(res, 400, "Email and token are required");

    try {
        const findUser = await pool.query(
            "SELECT userid, emailotp, emailotpexpires, isverified FROM users WHERE email=$1",
            [email]
        )

        if (!findUser.rows.length) {
            return sendResponse(res, 400, "User not found")
        }

        const user = findUser.rows[0]

        if (user.isverified) {
            return sendResponse(res, 400, "User already verified")
        }

        if  (user.emailotp !== otp || new Date(user.emailotpexpires) < new Date()) {
            return sendResponse(res, 400, "Invalid or expired OTP");
        }

        await pool.query(
                  "UPDATE users SET isverified=true, emailotp=NULL, emailotpexpires=NULL WHERE userid=$1",
                  [user.userid]
        )

        return sendResponse(res, 200, "Email verified successfully. You can now log in.")
    } catch (error) {
        console.error("OTP verification error:", error)
        return sendResponse(res, 500, "Error verifying OTP");
    }
}

export const resendOTP = async (req, res) => {
    const { email } = req.body;

    try {
        const findUser = await pool.query("SELECT userid, isverified FROM users WHERE email=$1", [email])
        if (!findUser.rows.length) {
            return sendResponse(res, 400, "User not found")
        }

        const user = findUser.rows[0]
        if (user.isverified) {
            return sendResponse(res, 400, "User already verified")
        }

        const otp = generateOTP()
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000)

        await pool.query(
            "UPDATE users SET emailotp=$1, emailotpexpires=$2 WHERE userid=$3",
            [otp, otpExpires, user.userid]
        )

        const otpSent =  await sendOTPEmail(email, otp, "Resend OTP Verification");
        if (!otpSent) {
            console.warn(`Failed to resend OTP to ${email}`)
        }

        return sendResponse(res, 200, "OTP resent successfully")
    } catch (error) {
        console.error("Error resending OTP:", error);
        return sendResponse(res, 500, "Error resending OTP")
    }
}

// for email updates
export const verifyNewEmailOTP = async (req, res) => {
    const { newemail, otp } = req.body;

    try {
        const findUser = await pool.query(
            "SELECT userid, emailotp, emailotpexpires, isnewemailverified FROM users WHERE newemail=$1",
            [newemail]
        )

        if (!findUser.rows.length) {
            return sendResponse(res, 400, "User not found")
        }

        const user = findUser.rows[0]

        if (user.isnewemailverified) {
            return sendResponse(res, 400, "User already verified")
        }

        if  (user.emailotp !== otp || new Date(user.emailotpexpires) < new Date()) {
            return sendResponse(res, 400, "Invalid or expired OTP");
        }

        await pool.query(
                  "UPDATE users SET email=$1, isverified=true, emailotp=NULL, emailotpexpires=NULL, newemail=null WHERE userid=$2",
                  [newemail, user.userid]
        )

        return sendResponse(res, 200, "Email verified successfully.")
    } catch (error) {
        console.error("OTP verification error:", error)
        return sendResponse(res, 500, "Error verifying OTP");
    }
}

// for email updates
export const resendNewEmailOTP = async (req, res) => {
    const { newemail } = req.body;

    try {
        const findUser = await pool.query("SELECT userid, isverified FROM users WHERE newemail=$1", [newemail])
        if (!findUser.rows.length) {
            return sendResponse(res, 400, "User not found")
        }

        const user = findUser.rows[0]
        if (user.isverified) {
            return sendResponse(res, 400, "User already verified")
        }

        const otp = generateOTP()
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000)

        await pool.query(
            "UPDATE users SET emailotp=$1, emailotpexpires=$2 WHERE userid=$3",
            [otp, otpExpires, user.userid]
        )

        const otpSent =  await sendOTPEmail(newemail, otp, "Resend OTP Verification");
        if (!otpSent) {
            console.warn(`Failed to resend OTP to ${newemail}`)
        }

        return sendResponse(res, 200, "OTP resent successfully")
    } catch (error) {
        console.error("Error resending OTP:", error);
        return sendResponse(res, 500, "Error resending OTP")
    }
}