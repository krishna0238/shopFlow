import { z } from "zod";

export const adjustStockSchema = z.object({
  businessId: z.string().uuid(),
  productId: z.string().uuid(),
  quantity: z.number().finite().refine((value) => value !== 0, {
    message: "Quantity cannot be zero",
  }),
  note: z.string().trim().max(500).optional(),
});

export type AdjustStockInput = z.infer<typeof adjustStockSchema>;