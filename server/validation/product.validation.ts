import { z } from "zod";

export const createProductSchema = z.object({
  businessId: z.string().uuid(),
  categoryId: z.string().uuid().optional(),
  name: z.string().trim().min(1),
  sku: z.string().trim().min(1).optional(),
  purchasePrice: z.number().nonnegative(),
  sellingPrice: z.number().nonnegative(),
  stockQuantity: z.number().nonnegative().default(0),
  lowStockThreshold: z.number().nonnegative().default(0),
});

export const deactivateProductSchema = z.object({
  businessId: z.string().uuid(),
  productId: z.string().uuid(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type DeactivateProductInput = z.infer<
  typeof deactivateProductSchema
>;
