import { prisma } from "@/lib/prisma";

export class PurchaseInvoiceItemService {
  static async createPurchaseInvoiceItem(
    businessId: string,
    purchaseInvoiceId: string,
    productId: string,
    quantity: number,
    unitPrice: number
  ) {
    const purchaseInvoice = await prisma.purchaseInvoice.findFirst({
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

    const product = await prisma.product.findFirst({
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

    return prisma.purchaseItem.create({
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
  }
}