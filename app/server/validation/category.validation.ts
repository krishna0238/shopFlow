import { z } from "zod";

export const createCategorySchema = z.object({
  businessId: z.string().uuid(),
  name: z.string().trim().min(1),
});

export type CreateCategoryInput = z.infer<
  typeof createCategorySchema
>;