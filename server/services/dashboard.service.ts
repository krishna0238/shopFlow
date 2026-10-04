import { prisma } from "@/lib/prisma";

export class DashboardService {
  static async getSummary(businessId: string) {
    const [
      productCount,
      customerCount,
      supplierCount,
      salesCount,
      purchaseInvoiceCount,
      salesTotal,
      creditTransactions,
      lowStockProducts,
      recentSales,
    ] = await Promise.all([
      prisma.product.count({
        where: {
          businessId,
          isActive: true,
        },
      }),

      prisma.customer.count({
        where: {
          businessId,
        },
      }),

      prisma.supplier.count({
        where: {
          businessId,
        },
      }),

      prisma.sale.count({
        where: {
          businessId,
        },
      }),

      prisma.purchaseInvoice.count({
        where: {
          businessId,
        },
      }),

      prisma.sale.aggregate({
        where: {
          businessId,
        },
        _sum: {
          totalAmount: true,
        },
      }),

      prisma.creditTransaction.findMany({
        where: {
          businessId,
        },
        select: {
          type: true,
          amount: true,
        },
      }),

      prisma.product.findMany({
        where: {
          businessId,
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          sku: true,
          stockQuantity: true,
          lowStockThreshold: true,
        },
      }),

      prisma.sale.findMany({
        where: {
          businessId,
        },
        select: {
          id: true,
          totalAmount: true,
          paymentMode: true,
          createdAt: true,
          customer: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
      }),
    ]);

    let outstandingCredit = 0;

    for (const transaction of creditTransactions) {
      if (transaction.type === "CREDIT") {
        outstandingCredit += Number(transaction.amount);
      } else if (transaction.type === "PAYMENT") {
        outstandingCredit -= Number(transaction.amount);
      }
    }

    const productsNeedingAttention = lowStockProducts.filter(
      (product) =>
        Number(product.stockQuantity) <=
        Number(product.lowStockThreshold)
    );

    return {
      productCount,
      customerCount,
      supplierCount,
      salesCount,
      purchaseInvoiceCount,
      salesTotal: salesTotal._sum.totalAmount ?? 0,
      outstandingCredit,
      lowStockCount: productsNeedingAttention.length,
      lowStockProducts: productsNeedingAttention,
      recentSales,
    };
  }
}