import { z } from "zod";

export const registerSchema = z.object({
  businessName: z.string().trim().min(1),
  ownerName: z.string().trim().min(1),
  ownerEmail: z.string().trim().email(),
  password: z.string().min(8),
});

export type RegisterInput = z.infer<typeof registerSchema>;