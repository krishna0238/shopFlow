import { prisma } from "@/lib/prisma";
import { AuditService } from "@/server/services/audit.service";
import type {
  CreateProductInput,
  DeactivateProductInput,
} from "@/server/validation/product.validation";

export class ProductService {
  static async getProducts(
    businessId: string,
    includeInactive = false
  ) {
    return prisma.product.findMany({
      where: {
        businessId,
        ...(includeInactive
          ? {}
          : {
              isActive: true,
            }),
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

      await AuditService.log(
        {
          businessId: input.businessId,
          action: "PRODUCT_CREATED",
          entityType: "Product",
          entityId: product.id,
          details: {
            productName: product.name,
            sku: product.sku ?? null,
            categoryId: product.categoryId ?? null,
            purchasePrice: input.purchasePrice,
            sellingPrice: input.sellingPrice,
            initialStockQuantity: input.stockQuantity,
            lowStockThreshold: input.lowStockThreshold,
          },
        },
        tx
      );

      return product;
    });
  }

  static async deactivateProduct(
    input: DeactivateProductInput
  ) {
    return prisma.$transaction(async (tx) => {
      const product = await tx.product.findFirst({
        where: {
          id: input.productId,
          businessId: input.businessId,
          isActive: true,
        },
      });

      if (!product) {
        throw new Error("Active product not found");
      }

      const updatedProduct = await tx.product.update({
        where: {
          id: product.id,
        },
        data: {
          isActive: false,
        },
      });

      await AuditService.log(
        {
          businessId: input.businessId,
          action: "PRODUCT_DEACTIVATED",
          entityType: "Product",
          entityId: product.id,
          details: {
            productName: product.name,
            sku: product.sku,
          },
        },
        tx
      );

      return updatedProduct;
    });
  }
}