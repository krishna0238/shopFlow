import { z } from "zod";

export const createPurchaseInvoiceSchema = z.object({
  supplierId: z.string().uuid(),
  invoiceNumber: z.string().trim().min(1).optional(),
  invoiceDate: z.coerce.date().optional(),
  totalAmount: z.number().nonnegative().optional(),
});

export const confirmPurchaseInvoiceSchema = z.object({
  purchaseInvoiceId: z.string().uuid(),
});

export type CreatePurchaseInvoiceInput = z.infer<
  typeof createPurchaseInvoiceSchema
>;

export type ConfirmPurchaseInvoiceInput = z.infer<
  typeof confirmPurchaseInvoiceSchema
>;
