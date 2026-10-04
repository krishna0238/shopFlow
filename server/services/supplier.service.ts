import { prisma } from "@/lib/prisma";

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
    return prisma.supplier.create({
      data: {
        businessId,
        name,
        phone,
        email,
        address,
      },
    });
  }
}