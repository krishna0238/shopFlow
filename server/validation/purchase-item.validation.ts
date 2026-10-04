import { z } from "zod";

export const createPurchaseItemSchema = z
  .object({
    businessId: z.string().uuid(),
    purchaseOrderId: z.string().uuid().optional(),
    purchaseInvoiceId: z.string().uuid().optional(),
    productId: z.string().uuid(),
    quantity: z.number().positive(),
    unitPrice: z.number().nonnegative(),
  })
  .refine(
    (data) =>
      (data.purchaseOrderId !== undefined) !==
      (data.purchaseInvoiceId !== undefined),
    {
      message:
        "Exactly one of purchaseOrderId or purchaseInvoiceId is required",
    }
  );

export type CreatePurchaseItemInput = z.infer<
  typeof createPurchaseItemSchema
>;