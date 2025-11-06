import { z } from "zod"

export const createAccountSchema = z.object({
    userId: z.coerce.number().int().positive(),
    name: z.string().min(1, "Account name is required"),
    accountType: z.enum(["checking", "savings"]),
    balance: z.number().nonnegative().optional(),
})

export const accountIdSchema = z.object({
    id: z.coerce.number().int().positive()
})

export const userIdSchema = z.object({
    userId: z.coerce.number().int().positive()
})