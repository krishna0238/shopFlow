import { prisma } from "@/lib/prisma";
import type { CreateProductInput } from "@/server/validation/product.validation";

export class ProductService {
  static async getProducts(businessId: string) {
    return prisma.product.findMany({
      where: {
        businessId,
        isActive: true,
      },
      include: {
        category: true,
      },
      orderBy: {
        name: "asc",
      },
    });
  }

  static async createProduct(input: CreateProductInput) {
    if (input.sku) {
      const existingProduct = await prisma.product.findFirst({
        where: {
          businessId: input.businessId,
          sku: input.sku,
          isActive: true,
        },
      });

      if (existingProduct) {
        throw new Error("A product with this SKU already exists");
      }
    }

    return prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          businessId: input.businessId,
          categoryId: input.categoryId,
          name: input.name,
          sku: input.sku,
          purchasePrice: input.purchasePrice,
          sellingPrice: input.sellingPrice,
          stockQuantity: input.stockQuantity,
          lowStockThreshold: input.lowStockThreshold,
        },
        include: {
          category: true,
        },
      });

      if (input.stockQuantity > 0) {
        await tx.inventoryMovement.create({
          data: {
            businessId: input.businessId,
            productId: product.id,
            type: "ADJUSTMENT",
            quantity: input.stockQuantity,
            note: "Initial stock",
          },
        });
      }

      return product;
    });
  }
}