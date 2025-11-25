import { z } from "zod"

export const registerSchema = z.object({
    name: z.string().min(2, "Name is required"),
    email: z.email("Valid email is required"),
    password: z.string().min(12, "Password must be at least 12 characters")
        .regex(/[A-Z]/, "Must contain an uppercase letter")
        .regex(/[a-z]/, "Must contain a lowercase letter")
        .regex(/[0-9]/, "Must contain a number")
        .regex(/[^A-Za-z0-9]/, "Must contain a special character")
})

export const loginSchema = z.object({
    email: z.string(1, "Email is required"),
    password: z.string().min(12, "Password is required")
})

export const updatePasswordSchema = z.object({
    email: z.email("Valid email is required"),
    password: z.string(),
    newPassword: z.string().min(12, "Password must be at least 12 characters")
        .regex(/[A-Z]/, "Must contain an uppercase letter")
        .regex(/[a-z]/, "Must contain a lowercase letter")
        .regex(/[0-9]/, "Must contain a number")
        .regex(/[^A-Za-z0-9]/, "Must contain a special character") 
})

export const updateProfileSchema = z.object({
    name: z.string().min(1).optional(),
    email: z.string().email().optional(),
});