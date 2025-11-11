import { z } from "zod"

// Deposit schema
export const depositSchema = z.object({
    accountid: z.coerce.number().int().positive(),
    amount: z.coerce.number().positive(),
})

// Withdraw schema
export const withdrawSchema = z.object({
    accountid: z.coerce.number().int().positive(),
    amount: z.coerce.number().positive(),
})

// Transfer schema
export const transferSchema = z.object({
    srcid: z.coerce.number().int().positive(),
    desid: z.coerce.number().int().positive(),
    amount: z.coerce.number().positive(),
})