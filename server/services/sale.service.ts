import { prisma } from "@/lib/prisma";
import { AuditService } from "@/server/services/audit.service";
import type { CreateSaleInput } from "@/server/validation/sale.validation";

export class SaleService {
  static async getSales(businessId: string) {
    return prisma.sale.findMany({
      where: {
        businessId,
      },
      include: {
        customer: true,
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

  static async createSale(
    businessId: string,
    input: CreateSaleInput
  ) {
    return prisma.$transaction(async (tx) => {
      if (input.paymentMode === "CREDIT" && !input.customerId) {
        throw new Error(
          "Customer is required for credit sales"
        );
      }

      if (input.customerId) {
        const customer = await tx.customer.findFirst({
          where: {
            id: input.customerId,
            businessId,
          },
        });

        if (!customer) {
          throw new Error("Customer not found");
        }
      }

      let totalAmount = 0;

      const saleItemsData = [];

      for (const item of input.items) {
        const product = await tx.product.findFirst({
          where: {
            id: item.productId,
            businessId,
            isActive: true,
          },
        });

        if (!product) {
          throw new Error("Product not found");
        }

        const currentStock = Number(product.stockQuantity);

        if (currentStock < item.quantity) {
          throw new Error(
            `Insufficient stock for product: ${product.name}`
          );
        }

        const itemTotal = item.quantity * item.unitPrice;

        totalAmount += itemTotal;

        saleItemsData.push({
          product,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: itemTotal,
        });
      }

      const sale = await tx.sale.create({
        data: {
          businessId,
          customerId: input.customerId,
          paymentMode: input.paymentMode,
          totalAmount,
        },
      });

      const saleItems = [];

      for (const item of saleItemsData) {
        const newStockQuantity =
          Number(item.product.stockQuantity) - item.quantity;

        await tx.product.update({
          where: {
            id: item.product.id,
          },
          data: {
            stockQuantity: newStockQuantity,
          },
        });

        const saleItem = await tx.saleItem.create({
          data: {
            saleId: sale.id,
            productId: item.product.id,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total,
          },
          include: {
            product: true,
          },
        });

        await tx.inventoryMovement.create({
          data: {
            businessId,
            productId: item.product.id,
            type: "SALE",
            quantity: -item.quantity,
            referenceId: sale.id,
            note: `Sale ${sale.id}`,
          },
        });

        saleItems.push(saleItem);
      }

      if (input.paymentMode === "CREDIT") {
        await tx.creditTransaction.create({
          data: {
            businessId,
            customerId: input.customerId!,
            type: "CREDIT",
            amount: totalAmount,
            note: `Credit sale ${sale.id}`,
          },
        });
      }

      await AuditService.log(
        {
          businessId,
          action: "SALE_CREATED",
          entityType: "Sale",
          entityId: sale.id,
          details: {
            paymentMode: input.paymentMode,
            totalAmount,
            customerId: input.customerId ?? null,
            itemCount: input.items.length,
          },
        },
        tx
      );

      return {
        sale,
        items: saleItems,
      };
    });
  }
}