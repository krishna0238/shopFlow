import { z } from "zod";

export const createSaleItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().positive(),
  unitPrice: z.number().nonnegative(),
});

export const createSaleSchema = z.object({
  customerId: z.string().uuid().optional(),
  paymentMode: z.enum(["CASH", "UPI", "CREDIT"]).default("CASH"),
  items: z.array(createSaleItemSchema).min(1),
});

export type CreateSaleInput = z.infer<typeof createSaleSchema>;
export type CreateSaleItemInput = z.infer<typeof createSaleItemSchema>;