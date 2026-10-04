import { prisma } from "@/lib/prisma";

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
    return prisma.customer.create({
      data: {
        businessId,
        name,
        phone,
        email,
      },
    });
  }
}