import { z } from "zod";

export const createSupplierSchema = z.object({
  businessId: z.string().uuid(),
  name: z.string().trim().min(1),
  phone: z.string().trim().min(1).optional(),
  email: z.string().trim().email().optional(),
  address: z.string().trim().min(1).optional(),
});

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;