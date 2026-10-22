
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
        throw new Error("Customer is required for credit sales");
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

      // Aggregate quantities so repeated lines for the same product
      // are checked against their combined quantity.
      const requestedQuantities = new Map<string, number>();

      for (const item of input.items) {
        const previousQuantity =
          requestedQuantities.get(item.productId) ?? 0;

        requestedQuantities.set(
          item.productId,
          previousQuantity + item.quantity
        );
      }

      // Load and validate each distinct product once.
      const products = new Map<
        string,
        Awaited<ReturnType<typeof tx.product.findFirst>>
      >();

      for (const productId of requestedQuantities.keys()) {
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

        products.set(productId, product);
      }

      // Calculate line totals on the server.
      const saleItemsData = input.items.map((item) => {
        const product = products.get(item.productId);

        if (!product) {
          throw new Error("Product not found");
        }

        return {
          product,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.quantity * item.unitPrice,
        };
      });

      // Compute subtotal and per-line GST
      const subtotal = saleItemsData.reduce(
        (sum, item) => sum + item.total,
        0
      );

      const taxBreakdown: Record<
        string,
        { rate: number; cgst: number; sgst: number; total: number }
      > = {};
      let taxAmount = 0;

      for (const item of saleItemsData) {
        const rate = Number(item.product.gstRate ?? 0);
        if (rate > 0) {
          const lineTax = (item.total * rate) / 100;
          const half = lineTax / 2;
          const key = `${rate}%`;
          if (!taxBreakdown[key]) {
            taxBreakdown[key] = { rate, cgst: 0, sgst: 0, total: 0 };
          }
          taxBreakdown[key].cgst += half;
          taxBreakdown[key].sgst += half;
          taxBreakdown[key].total += lineTax;
          taxAmount += lineTax;
        }
      }

      const totalAmount = subtotal + taxAmount;

      // Atomically deduct each product's combined quantity.
      // The stock condition is checked by PostgreSQL as part of
      // the update, protecting against concurrent sales.
      for (const [productId, requestedQuantity] of requestedQuantities) {
        const product = products.get(productId);

        if (!product) {
          throw new Error("Product not found");
        }

        const result = await tx.product.updateMany({
          where: {
            id: productId,
            businessId,
            isActive: true,
            stockQuantity: {
              gte: requestedQuantity,
            },
          },
          data: {
            stockQuantity: {
              decrement: requestedQuantity,
            },
          },
        });

        if (result.count !== 1) {
          throw new Error(
            `Insufficient stock for product: ${product.name}`
          );
        }
      }

      const sale = await tx.sale.create({
        data: {
          businessId,
          customerId: input.customerId,
          paymentMode: input.paymentMode,
          subtotal,
          taxAmount,
          taxBreakdown:
            Object.keys(taxBreakdown).length > 0 ? taxBreakdown : undefined,
          totalAmount,
        },
      });

      const saleItems = [];

      for (const item of saleItemsData) {
        const saleItem = await tx.saleItem.create({
          data: {
            saleId: sale.id,
            productId: item.productId,
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
            productId: item.productId,
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
            subtotal,
            taxAmount,
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
