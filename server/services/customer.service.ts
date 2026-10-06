import { prisma } from "@/lib/prisma";
import { AuditService } from "@/server/services/audit.service";

export class CustomerService {
  static async getCustomers(businessId: string) {
    return prisma.customer.findMany({
      where: {
        businessId,
      },
      orderBy: {
        name: "asc",
      },
    });
  }

  static async createCustomer(
    businessId: string,
    name: string,
    phone?: string,
    email?: string
  ) {
    return prisma.$transaction(async (tx) => {
      const customer = await tx.customer.create({
        data: {
          businessId,
          name,
          phone,
          email,
        },
      });

      await AuditService.log(
        {
          businessId,
          action: "CUSTOMER_CREATED",
          entityType: "Customer",
          entityId: customer.id,
          details: {
            name: customer.name,
            phone: customer.phone ?? null,
            email: customer.email ?? null,
          },
        },
        tx
      );

      return customer;
    });
  }
}