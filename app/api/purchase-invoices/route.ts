
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { PurchaseInvoiceService } from "@/server/services/purchase-invoice.service";
import { createPurchaseInvoiceSchema } from "@/server/validation/purchase-invoice.validation";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const purchaseInvoices =
      await PurchaseInvoiceService.getPurchaseInvoices(
        user.businessId
      );

    return NextResponse.json({ purchaseInvoices });
  } catch (error) {
    console.error("Failed to fetch purchase invoices:", error);

    return NextResponse.json(
      { error: "Failed to fetch purchase invoices" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const result = createPurchaseInvoiceSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Invalid purchase invoice data",
          details: result.error.issues,
        },
        { status: 400 }
      );
    }

    const purchaseInvoice =
      await PurchaseInvoiceService.createPurchaseInvoice(
        user.businessId,
        result.data.supplierId,
        result.data.invoiceNumber,
        result.data.invoiceDate,
        result.data.totalAmount
      );

    return NextResponse.json(
      { purchaseInvoice },
      { status: 201 }
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Supplier not found"
    ) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    console.error("Failed to create purchase invoice:", error);

    return NextResponse.json(
      { error: "Failed to create purchase invoice" },
      { status: 500 }
    );
  }
}
