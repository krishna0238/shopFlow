
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
    invoiceDate: Date | undefined,
    totalAmount: number
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
        totalAmount,
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

      for (const item of invoice.items) {
        const product = await tx.product.findFirst({
          where: {
            id: item.productId,
            businessId,
            isActive: true,
          },
          select: {
            id: true,
          },
        });

        if (!product) {
          throw new Error("Product not found");
        }

        await tx.product.update({
          where: {
            id: product.id,
          },
          data: {
            stockQuantity: {
              increment: item.quantity,
            },
            purchasePrice: item.unitPrice,
          },
        });

        await tx.inventoryMovement.create({
          data: {
            businessId,
            productId: product.id,
            type: "PURCHASE",
            quantity: item.quantity,
            referenceId: invoice.id,
            note: `Purchase invoice ${invoice.invoiceNumber ?? invoice.id}`,
          },
        });
      }

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
