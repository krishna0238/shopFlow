import { prisma } from "@/lib/prisma";

export class PurchaseOrderService {
  static async getPurchaseOrders(businessId: string) {
    return prisma.purchaseOrder.findMany({
      where: {
        businessId,
      },
      include: {
        supplier: true,
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  static async createPurchaseOrder(
    businessId: string,
    supplierId: string
  ) {
    const supplier = await prisma.supplier.findFirst({
      where: {
        id: supplierId,
        businessId,
      },
    });

    if (!supplier) {
      throw new Error("Supplier not found");
    }

    return prisma.purchaseOrder.create({
      data: {
        businessId,
        supplierId,
        status: "DRAFT",
      },
      include: {
        supplier: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });
  }
}