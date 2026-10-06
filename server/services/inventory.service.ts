import { prisma } from "@/lib/prisma";
import { AuditService } from "@/server/services/audit.service";

export class InventoryService {
  static async getProductMovements(
    businessId: string,
    productId: string
  ) {
    return prisma.inventoryMovement.findMany({
      where: {
        businessId,
        productId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  static async adjustStock(
    businessId: string,
    productId: string,
    quantity: number,
    note?: string
  ) {
    return prisma.$transaction(async (tx) => {
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

      const previousStock = Number(product.stockQuantity);

      const newStockQuantity =
        previousStock + quantity;

      if (newStockQuantity < 0) {
        throw new Error("Stock quantity cannot become negative");
      }

      const updatedProduct = await tx.product.update({
        where: {
          id: product.id,
        },
        data: {
          stockQuantity: newStockQuantity,
        },
      });

      const movement = await tx.inventoryMovement.create({
        data: {
          businessId,
          productId,
          type: "ADJUSTMENT",
          quantity,
          note,
        },
      });

      await AuditService.log(
        {
          businessId,
          action: "INVENTORY_ADJUSTED",
          entityType: "Product",
          entityId: product.id,
          details: {
            productName: product.name,
            quantity,
            previousStock,
            newStock: newStockQuantity,
            note: note ?? null,
          },
        },
        tx
      );

      return {
        product: updatedProduct,
        movement,
      };
    });
  }
}