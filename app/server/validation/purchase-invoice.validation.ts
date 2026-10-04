import { z } from "zod";

export const createPurchaseInvoiceSchema = z.object({
  businessId: z.string().uuid(),
  supplierId: z.string().uuid(),
  invoiceNumber: z.string().trim().optional(),
  invoiceDate: z.string().datetime().optional(),
  totalAmount: z.number().nonnegative(),
});

export const confirmPurchaseInvoiceSchema = z.object({
  businessId: z.string().uuid(),
  purchaseInvoiceId: z.string().uuid(),
});

export type CreatePurchaseInvoiceInput = z.infer<
  typeof createPurchaseInvoiceSchema
>;

export type ConfirmPurchaseInvoiceInput = z.infer<
  typeof confirmPurchaseInvoiceSchema
>;