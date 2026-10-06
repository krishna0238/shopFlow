import { prisma } from "@/lib/prisma";
import type { PrismaClient } from "@/app/generated/prisma/client";

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | {
      [key: string]: JsonValue;
    };

type JsonObject = {
  [key: string]: JsonValue;
};

type AuditDatabase = Pick<PrismaClient, "auditLog">;

export type CreateAuditLogInput = {
  businessId: string;
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: JsonObject | JsonValue[];
};

export class AuditService {
  static async log(
    input: CreateAuditLogInput,
    database: AuditDatabase = prisma
  ) {
    return database.auditLog.create({
      data: {
        businessId: input.businessId,
        userId: input.userId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        ...(input.details !== undefined
          ? {
              details: input.details,
            }
          : {}),
      },
    });
  }
}