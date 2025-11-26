import { z } from "zod"

export const registerSchema = z.object({
    name: z.string().min(2, "Name is required"),
    email: z.string().email({ message: "Valid email is required." }),
    password: z.string().min(12, "Password must be at least 12 characters")
        .regex(/[A-Z]/, "Must contain an uppercase letter")
        .regex(/[a-z]/, "Must contain a lowercase letter")
        .regex(/[0-9]/, "Must contain a number")
        .regex(/[^A-Za-z0-9]/, "Must contain a special character")
})

export const loginSchema = z.object({
    email: z.string(1, "Email is required"),
    password: z.string().nonempty({ message: "Password is required." }),
})

export const updatePasswordSchema = z.object({
    email: z.email("Valid email is required"),
    password: z.string().nonempty({ message: "Password is required." }),
    newPassword: z.string().min(12, "Password must be at least 12 characters")
        .regex(/[A-Z]/, "Must contain an uppercase letter")
        .regex(/[a-z]/, "Must contain a lowercase letter")
        .regex(/[0-9]/, "Must contain a number")
        .regex(/[^A-Za-z0-9]/, "Must contain a special character") 
})

export const updateNameSchema = z.object({
    userid: z.number().int().positive({ message: "Valid userid is required" }),
    newName: z.string().min(2, { messge: "New name must be at least 2 chars." })
        .regex(/^[A-Za-z]+(?: [A-Za-z]+)*$/, { 
        message: "Name can contain letters and spaces, but not start or end with a space" })
})

export const updateEmailSchema = z.object({
    email: z.email("Valid email is required."),
    password: z.string().nonempty({ message: "Password is required." }),
    newEmail: z.string().email({ message: "Valid email is required." }),
})