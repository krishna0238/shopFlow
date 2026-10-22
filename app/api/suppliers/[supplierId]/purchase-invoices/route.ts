
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ supplierId: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { supplierId } = await params;

    const supplier = await prisma.supplier.findFirst({
      where: {
        id: supplierId,
        businessId: user.businessId,
      },
      select: {
        id: true,
      },
    });

    if (!supplier) {
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 }
      );
    }

    const purchaseInvoices =
      await prisma.purchaseInvoice.findMany({
        where: {
          businessId: user.businessId,
          supplierId: supplier.id,
        },
        select: {
          id: true,
          invoiceNumber: true,
          invoiceDate: true,
          totalAmount: true,
          status: true,
          supplier: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

    return NextResponse.json({ purchaseInvoices });
  } catch (error) {
    console.error(
      "Failed to fetch supplier purchase invoices:",
      error
    );

    return NextResponse.json(
      { error: "Failed to fetch supplier purchase invoices" },
      { status: 500 }
    );
  }
}
