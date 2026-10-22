import { z } from "zod";

export const createProductSchema = z.object({
  categoryId: z.string().uuid().optional(),
  name: z.string().trim().min(1),
  sku: z.string().trim().min(1).optional(),
  hsnCode: z.string().trim().optional(),
  gstRate: z.number().min(0).max(28).default(0),
  purchasePrice: z.number().nonnegative(),
  sellingPrice: z.number().nonnegative(),
  stockQuantity: z.number().nonnegative().default(0),
  lowStockThreshold: z.number().nonnegative().default(0),
});

export type CreateProductInput = z.infer<
  typeof createProductSchema
> & {
  businessId: string;
};

export const deactivateProductSchema = z.object({
  businessId: z.string().uuid(),
  productId: z.string().uuid(),
});

export type DeactivateProductInput = z.infer<
  typeof deactivateProductSchema
>;