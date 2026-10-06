import { prisma } from "@/lib/prisma";
import { AuditService } from "@/server/services/audit.service";

export class SupplierService {
  static async getSuppliers(businessId: string) {
    return prisma.supplier.findMany({
      where: {
        businessId,
      },
      orderBy: {
        name: "asc",
      },
    });
  }

  static async createSupplier(
    businessId: string,
    name: string,
    phone?: string,
    email?: string,
    address?: string
  ) {
    return prisma.$transaction(async (tx) => {
      const supplier = await tx.supplier.create({
        data: {
          businessId,
          name,
          phone,
          email,
          address,
        },
      });

      await AuditService.log(
        {
          businessId,
          action: "SUPPLIER_CREATED",
          entityType: "Supplier",
          entityId: supplier.id,
          details: {
            name: supplier.name,
            phone: supplier.phone ?? null,
            email: supplier.email ?? null,
            address: supplier.address ?? null,
          },
        },
        tx
      );

      return supplier;
    });
  }
}
