
import { prisma } from "@/lib/prisma";

export class PurchaseInvoiceItemService {
  static async createPurchaseInvoiceItem(
    businessId: string,
    purchaseInvoiceId: string,
    productId: string,
    quantity: number,
    unitPrice: number
  ) {
    return prisma.$transaction(async (tx) => {
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

      const purchaseInvoice = await tx.purchaseInvoice.findFirst({
        where: {
          id: purchaseInvoiceId,
          businessId,
        },
      });

      if (!purchaseInvoice) {
        throw new Error("Purchase invoice not found");
      }

      if (purchaseInvoice.status !== "DRAFT") {
        throw new Error(
          "Items can only be added to a draft purchase invoice"
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
          invoiceId: purchaseInvoiceId,
        },
        include: {
          product: true,
          invoice: true,
        },
      });
    });
  }
}
