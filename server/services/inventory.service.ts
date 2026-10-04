import { prisma } from "@/lib/prisma";

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

      const newStockQuantity =
        Number(product.stockQuantity) + quantity;

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

      return {
        product: updatedProduct,
        movement,
      };
    });
  }
}