import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const businessId = user.businessId;

    // 1. Fetch products
    const products = await prisma.product.findMany({
      where: { businessId, isActive: true },
      select: {
        id: true,
        name: true,
        sku: true,
        stockQuantity: true,
        lowStockThreshold: true,
        purchasePrice: true,
        sellingPrice: true,
      },
    });

    const lowStockItems = products.filter(
      (p) => Number(p.stockQuantity) <= Number(p.lowStockThreshold)
    );

    const outOfStockItems = products.filter(
      (p) => Number(p.stockQuantity) === 0
    );

    const totalStockValue = products.reduce(
      (sum, p) => sum + Number(p.stockQuantity) * Number(p.purchasePrice),
      0
    );

    // 2. Fetch customers with credit transactions
    const customers = await prisma.customer.findMany({
      where: { businessId },
      include: {
        creditTransactions: true,
      },
    });

    const customersWithBalance = customers
      .map((c) => {
        const balance = c.creditTransactions.reduce((acc, tx) => {
          return tx.type === "CREDIT"
            ? acc + Number(tx.amount)
            : acc - Number(tx.amount);
        }, 0);
        return {
          id: c.id,
          name: c.name,
          phone: c.phone,
          balance,
        };
      })
      .filter((c) => c.balance > 0)
      .sort((a, b) => b.balance - a.balance);

    const totalOutstandingCredit = customersWithBalance.reduce(
      (sum, c) => sum + c.balance,
      0
    );

    // 3. Fetch recent audit logs / activity
    const recentActivity = await prisma.auditLog.findMany({
      where: { businessId },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        user: {
          select: { name: true },
        },
      },
    });

    // Detect price changes across purchase items
    const recentPurchaseItems = await prisma.purchaseItem.findMany({
      where: {
        invoice: {
          businessId: user.businessId,
          status: "CONFIRMED",
        },
      },
      include: {
        product: { select: { id: true, name: true, purchasePrice: true } },
        invoice: { select: { invoiceDate: true, createdAt: true } },
      },
      orderBy: { invoice: { createdAt: "desc" } },
      take: 200,
    });

    // Group by product and find price changes
    const productPriceMap = new Map<string, { name: string; prices: { price: number; date: Date }[] }>();
    for (const item of recentPurchaseItems) {
      if (!item.invoice) continue;
      const pid = item.productId;
      if (!productPriceMap.has(pid)) {
        productPriceMap.set(pid, { name: item.product.name, prices: [] });
      }
      productPriceMap.get(pid)!.prices.push({
        price: Number(item.unitPrice),
        date: item.invoice.invoiceDate ?? item.invoice.createdAt,
      });
    }

    const priceChanges: Array<{
      productName: string;
      oldPrice: number;
      newPrice: number;
      changePct: number;
      direction: string;
    }> = [];

    for (const [, data] of productPriceMap) {
      if (data.prices.length < 2) continue;
      // Sorted descending by date; compare latest vs previous
      const latest = data.prices[0];
      const previous = data.prices[1];
      if (latest.price !== previous.price) {
        const changePct = ((latest.price - previous.price) / previous.price) * 100;
        priceChanges.push({
          productName: data.name,
          oldPrice: previous.price,
          newPrice: latest.price,
          changePct: Math.round(changePct * 10) / 10,
          direction: changePct > 0 ? "up" : "down",
        });
      }
    }

    return NextResponse.json({
      summary: {
        totalProducts: products.length,
        lowStockCount: lowStockItems.length,
        outOfStockCount: outOfStockItems.length,
        totalStockValue,
        totalOutstandingCredit,
        customersWithCreditCount: customersWithBalance.length,
      },
      lowStockItems,
      customersWithBalance,
      recentActivity,
      priceChanges,
    });
  } catch (error) {
    console.error("GET /api/intelligence error:", error);
    return NextResponse.json(
      { error: "Failed to load intelligence data" },
      { status: 500 }
    );
  }
}
