import { z } from "zod";

export const createCreditTransactionSchema = z.object({
  businessId: z.string().uuid(),
  customerId: z.string().uuid(),
  type: z.enum(["CREDIT", "PAYMENT"]),
  amount: z.number().positive(),
  note: z.string().trim().max(500).optional(),
});

export type CreateCreditTransactionInput = z.infer<
  typeof createCreditTransactionSchema
>;