import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { AuditService } from "@/server/services/audit.service";
import type { RegisterInput } from "@/server/validation/auth.validation";

export class AuthService {
  static async register(input: RegisterInput) {
    const existingUser = await prisma.user.findUnique({
      where: {
        email: input.ownerEmail,
      },
    });

    if (existingUser) {
      throw new Error("An account with this email already exists");
    }

    const passwordHash = await hashPassword(input.password);

    return prisma.$transaction(async (tx) => {
      const business = await tx.business.create({
        data: {
          name: input.businessName,
        },
      });

      const user = await tx.user.create({
        data: {
          businessId: business.id,
          name: input.ownerName,
          email: input.ownerEmail,
          passwordHash,
          role: "OWNER",
        },
      });

      await AuditService.log(
        {
          businessId: business.id,
          action: "BUSINESS_CREATED",
          entityType: "Business",
          entityId: business.id,
          details: {
            name: business.name,
          },
        },
        tx
      );

      await AuditService.log(
        {
          businessId: business.id,
          userId: user.id,
          action: "USER_CREATED",
          entityType: "User",
          entityId: user.id,
          details: {
            name: user.name,
            email: user.email,
            role: user.role,
          },
        },
        tx
      );

      return {
        business: {
          id: business.id,
          name: business.name,
        },
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      };
    });
  }
}