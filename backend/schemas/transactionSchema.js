import { z } from "zod";

// Deposit schema
export const depositSchema = z.object({
    accountId: z.coerce.number().int().positive(),
    amount: z.coerce.number().positive(),
})

// Withdraw schema
export const withdrawSchema = z.object({
    accountId: z.coerce.number().int().positive(),
    amount: z.coerce.number().positive(),
})

// Transfer schema
export const transferSchema = z.object({
    srcId: z.coerce.number().int().positive(),
    desId: z.coerce.number().int().positive(),
    amount: z.coerce.number().positive(),
    }).refine((data) => data.srcId !== data.desId, {
        message: "Source and destination accounts must be different",
        path: ["desId"]
});
