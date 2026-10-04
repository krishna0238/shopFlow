import { prisma } from "@/lib/prisma";

export class PurchaseItemService {
  static async getPurchaseOrderItems(
    businessId: string,
    purchaseOrderId: string
  ) {
    const purchaseOrder = await prisma.purchaseOrder.findFirst({
      where: {
        id: purchaseOrderId,
        businessId,
      },
    });

    if (!purchaseOrder) {
      throw new Error("Purchase order not found");
    }

    return prisma.purchaseItem.findMany({
      where: {
        orderId: purchaseOrderId,
      },
      include: {
        product: true,
      },
      orderBy: {
        id: "asc",
      },
    });
  }

  static async createPurchaseItem(
    businessId: string,
    purchaseOrderId: string,
    productId: string,
    quantity: number,
    unitPrice: number
  ) {
    const purchaseOrder = await prisma.purchaseOrder.findFirst({
      where: {
        id: purchaseOrderId,
        businessId,
      },
    });

    if (!purchaseOrder) {
      throw new Error("Purchase order not found");
    }

    if (purchaseOrder.status !== "DRAFT") {
      throw new Error(
        "Items can only be added to a draft purchase order"
      );
    }

    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        businessId,
        isActive: true,
      },
    });

    if (!product) {
      throw new Error("Product not found");
    }

    const total = quantity * unitPrice;

    return prisma.purchaseItem.create({
      data: {
        productId,
        quantity,
        unitPrice,
        total,
        orderId: purchaseOrderId,
      },
      include: {
        product: true,
        order: true,
      },
    });
  }
}