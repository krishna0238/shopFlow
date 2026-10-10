
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json(
        { error: "productId is required" },
        { status: 400 }
      );
    }

    const businessId = user.businessId;

    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        businessId,
      },
      select: {
        id: true,
        name: true,
        purchasePrice: true,
        sellingPrice: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    const purchaseItems = await prisma.purchaseItem.findMany({
      where: {
        productId,
        invoice: {
          is: {
            businessId,
            status: "CONFIRMED",
          },
        },
      },
      include: {
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            invoiceDate: true,
            createdAt: true,
            status: true,
          },
        },
      },
      orderBy: {
        id: "desc",
      },
    });

    const saleItems = await prisma.saleItem.findMany({
      where: {
        productId,
        sale: {
          businessId,
        },
      },
      include: {
        sale: {
          select: {
            id: true,
            createdAt: true,
            paymentMode: true,
          },
        },
      },
      orderBy: {
        id: "desc",
      },
    });

    const purchaseHistory = [];

    for (const item of purchaseItems) {
      if (!item.invoice) {
        continue;
      }

      const invoice = item.invoice;
      const date = invoice.invoiceDate ?? invoice.createdAt;

      purchaseHistory.push({
        id: item.id,
        type: "PURCHASE" as const,
        price: Number(item.unitPrice),
        quantity: Number(item.quantity),
        date: date.toISOString(),
        status: invoice.status,
        referenceId: invoice.id,
        reference:
          invoice.invoiceNumber ??
          `Purchase Invoice ${invoice.id}`,
      });
    }

    const saleHistory = saleItems.map((item) => ({
      id: item.id,
      type: "SALE" as const,
      price: Number(item.unitPrice),
      quantity: Number(item.quantity),
      date: item.sale.createdAt.toISOString(),
      status: "COMPLETED" as const,
      referenceId: item.sale.id,
      reference: `Sale ${item.sale.id}`,
      paymentMode: item.sale.paymentMode,
    }));

    const history = [...purchaseHistory, ...saleHistory].sort(
      (a, b) =>
        new Date(b.date).getTime() -
        new Date(a.date).getTime()
    );

    return NextResponse.json({
      product: {
        id: product.id,
        name: product.name,
      },
      currentPrices: {
        purchasePrice: Number(product.purchasePrice),
        sellingPrice: Number(product.sellingPrice),
      },
      history,
    });
  } catch (error) {
    console.error("Failed to load product price history:", error);

    return NextResponse.json(
      { error: "Failed to load product price history" },
      { status: 500 }
    );
  }
}
