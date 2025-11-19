import nodemailer from "nodemailer";
import 'dotenv/config';
import { otpEmailTemplate } from "./emailTemplates.js";

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.GMAIL_USER,
        // app password, not normal Gmail password
        pass: process.env.GMAIL_APP_PASSWORD,
    }
})


// Function to send OTP email
export const sendOTPEmail = async (to, otp) => {

    try {
        await transporter.sendMail({
            from: process.env.GMAIL_USER,
            to,
            subject: "BluePeak Bank – Verify Your Email",
            html: otpEmailTemplate(otp, to),
            text: `Your verification code is: ${otp}` 
        })
        return true;


    } catch (error) {
        console.error("Error sending OTP email: ", error)
        return false
    }
};

export const sendEmail = async ({ to, subject, text, html }) => {
    try {
        await transporter.sendMail({ from: process.env.GMAIL_USER, to, subject, text, html })
        return true

    } catch (error) {
        console.error("Error sending email:", error)
        return false
    }
};
