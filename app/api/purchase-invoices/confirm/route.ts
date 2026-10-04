import { NextResponse } from "next/server";
import { PurchaseInvoiceService } from "@/server/services/purchase-invoice.service";
import { confirmPurchaseInvoiceSchema } from "@/server/validation/purchase-invoice.validation";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const result = confirmPurchaseInvoiceSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Invalid purchase invoice confirmation data",
          details: result.error.issues,
        },
        { status: 400 }
      );
    }

    const purchaseInvoice =
      await PurchaseInvoiceService.confirmPurchaseInvoice(
        result.data.businessId,
        result.data.purchaseInvoiceId
      );

    return NextResponse.json({
      purchaseInvoice,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Purchase invoice not found"
    ) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    if (
      error instanceof Error &&
      error.message ===
        "Only draft purchase invoices can be confirmed"
    ) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }

    if (
      error instanceof Error &&
      error.message ===
        "Purchase invoice must contain at least one item"
    ) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }

    if (
      error instanceof Error &&
      error.message === "Product not found"
    ) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    console.error("Failed to confirm purchase invoice:", error);

    return NextResponse.json(
      {
        error: "Failed to confirm purchase invoice",
      },
      { status: 500 }
    );
  }
}