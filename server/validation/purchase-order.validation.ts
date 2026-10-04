import { z } from "zod";

export const createPurchaseOrderSchema = z.object({
  businessId: z.string().uuid(),
  supplierId: z.string().uuid(),
});

export type CreatePurchaseOrderInput = z.infer<
  typeof createPurchaseOrderSchema
>;