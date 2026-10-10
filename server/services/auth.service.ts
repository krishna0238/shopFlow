import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";
import { SessionService } from "@/server/services/session.service";
import { AuditService } from "@/server/services/audit.service";
import type {
  LoginInput,
  RegisterInput,
} from "@/server/validation/auth.validation";

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

  static async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: {
        email: input.email,
      },
      include: {
        business: true,
      },
    });

    if (!user) {
      throw new Error("Invalid email or password");
    }

    const passwordIsValid = await verifyPassword(
      input.password,
      user.passwordHash
    );

    if (!passwordIsValid) {
      throw new Error("Invalid email or password");
    }

    const { token } = await SessionService.createSession(user.id);

    await AuditService.log({
      businessId: user.businessId,
      userId: user.id,
      action: "USER_LOGIN",
      entityType: "User",
      entityId: user.id,
      details: {
        email: user.email,
      },
    });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      business: {
        id: user.business.id,
        name: user.business.name,
      },
    };
  }
}