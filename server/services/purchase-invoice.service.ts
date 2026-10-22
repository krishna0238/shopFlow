
import { prisma } from "@/lib/prisma";
import { AuditService } from "@/server/services/audit.service";

export class PurchaseInvoiceService {
  static async getPurchaseInvoices(businessId: string) {
    return prisma.purchaseInvoice.findMany({
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

  static async createPurchaseInvoice(
    businessId: string,
    supplierId: string,
    invoiceNumber: string | undefined,
    invoiceDate: Date | undefined
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

    return prisma.purchaseInvoice.create({
      data: {
        businessId,
        supplierId,
        invoiceNumber,
        invoiceDate,
        totalAmount: 0,
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

  static async confirmPurchaseInvoice(
    businessId: string,
    purchaseInvoiceId: string
  ) {
    return prisma.$transaction(async (tx) => {
      // Lock the invoice to prevent it being confirmed twice.
      const lockedInvoices = await tx.$queryRaw<
        Array<{ id: string }>
      >`
        SELECT "id"
        FROM "purchase_invoices"
        WHERE "id" = ${purchaseInvoiceId}
          AND "businessId" = ${businessId}
        FOR UPDATE
      `;

      if (lockedInvoices.length === 0) {
        throw new Error("Purchase invoice not found");
      }

      const invoice = await tx.purchaseInvoice.findFirst({
        where: {
          id: purchaseInvoiceId,
          businessId,
        },
        include: {
          items: true,
        },
      });

      if (!invoice) {
        throw new Error("Purchase invoice not found");
      }

      if (invoice.status !== "DRAFT") {
        throw new Error(
          "Only draft purchase invoices can be confirmed"
        );
      }

      if (invoice.items.length === 0) {
        throw new Error(
          "Purchase invoice must contain at least one item"
        );
      }

      // Group duplicate invoice lines by product.
      const groupedItems = new Map<
        string,
        {
          quantity: number;
          totalCost: number;
        }
      >();

      for (const item of invoice.items) {
        const quantity = Number(item.quantity);
        const unitPrice = Number(item.unitPrice);

        if (
          !Number.isFinite(quantity) ||
          quantity <= 0 ||
          !Number.isFinite(unitPrice) ||
          unitPrice < 0
        ) {
          throw new Error(
            "Invalid purchase item quantity or price"
          );
        }

        const existing = groupedItems.get(item.productId);

        if (existing) {
          existing.quantity += quantity;
          existing.totalCost += quantity * unitPrice;
        } else {
          groupedItems.set(item.productId, {
            quantity,
            totalCost: quantity * unitPrice,
          });
        }
      }

      // Update each product once using weighted-average cost.
      for (const [productId, purchase] of groupedItems) {
        const product = await tx.product.findFirst({
          where: {
            id: productId,
            businessId,
            isActive: true,
          },
          select: {
            id: true,
            stockQuantity: true,
            purchasePrice: true,
          },
        });

        if (!product) {
          throw new Error("Product not found");
        }

        const oldStock = Number(product.stockQuantity);
        const oldCost = Number(product.purchasePrice);

        if (
          !Number.isFinite(oldStock) ||
          oldStock < 0 ||
          !Number.isFinite(oldCost) ||
          oldCost < 0
        ) {
          throw new Error(
            "Invalid existing product stock or purchase price"
          );
        }

        const newStock = oldStock + purchase.quantity;

        const newPurchasePrice =
          newStock > 0
            ? (
                oldStock * oldCost + purchase.totalCost
              ) / newStock
            : 0;

        await tx.product.update({
          where: {
            id: product.id,
          },
          data: {
            stockQuantity: {
              increment: purchase.quantity,
            },
            purchasePrice: newPurchasePrice,
          },
        });
      }

      // Keep a separate inventory movement for every invoice line.
      for (const item of invoice.items) {
        await tx.inventoryMovement.create({
          data: {
            businessId,
            productId: item.productId,
            type: "PURCHASE",
            quantity: item.quantity,
            referenceId: invoice.id,
            note: `Purchase invoice ${
              invoice.invoiceNumber ?? invoice.id
            }`,
          },
        });
      }

      // Mark the invoice confirmed within the same transaction.
      const confirmedInvoice = await tx.purchaseInvoice.update({
        where: {
          id: invoice.id,
        },
        data: {
          status: "CONFIRMED",
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

      // Keep the audit log in the transaction.
      await AuditService.log(
        {
          businessId,
          action: "PURCHASE_INVOICE_CONFIRMED",
          entityType: "PurchaseInvoice",
          entityId: invoice.id,
          details: {
            supplierId: invoice.supplierId,
            invoiceNumber: invoice.invoiceNumber ?? null,
            totalAmount: Number(invoice.totalAmount),
            itemCount: invoice.items.length,
          },
        },
        tx
      );

      return confirmedInvoice;
    });
  }
}
