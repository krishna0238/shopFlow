
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
    return prisma.$transaction(async (tx) => {
      const lockedOrders = await tx.$queryRaw<
        Array<{ id: string }>
      >`
        SELECT "id"
        FROM "purchase_orders"
        WHERE "id" = ${purchaseOrderId}
          AND "businessId" = ${businessId}
        FOR UPDATE
      `;

      if (lockedOrders.length === 0) {
        throw new Error("Purchase order not found");
      }

      const purchaseOrder = await tx.purchaseOrder.findFirst({
        where: {
          id: purchaseOrderId,
          businessId,
        },
        select: {
          id: true,
          status: true,
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

      const product = await tx.product.findFirst({
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

      return tx.purchaseItem.create({
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
    });
  }
}
