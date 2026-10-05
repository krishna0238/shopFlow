import { prisma } from "@/lib/prisma";

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

export type CreateAuditLogInput = {
  businessId: string;
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: JsonObject | JsonValue[];
};

export class AuditService {
  static async log(input: CreateAuditLogInput) {
    return prisma.auditLog.create({
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