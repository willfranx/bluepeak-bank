import { z } from "zod"

export const createTransactionSchema = z.object({
    fromAccountId: z.coerce.number().int().positive(),
    toAccountId: z.coerce.number().int().positive(),
    amount: z.number().positive()
})