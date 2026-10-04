import { prisma } from "@/lib/prisma";

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
    invoiceDate: string | undefined,
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
        invoiceDate: invoiceDate
          ? new Date(invoiceDate)
          : undefined,
        totalAmount,
      },
        include: {
          supplier: true,
          items: true,
        },
      });
  }

  static async confirmPurchaseInvoice(
    businessId: string,
    purchaseInvoiceId: string
  ) {
    return prisma.$transaction(async (tx) => {
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
        });

        if (!product) {
          throw new Error("Product not found");
        }

        const newStockQuantity =
          Number(product.stockQuantity) + Number(item.quantity);

        await tx.product.update({
          where: {
            id: product.id,
          },
          data: {
            stockQuantity: newStockQuantity,
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

      return tx.purchaseInvoice.update({
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
    });
  }
}