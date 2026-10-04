import { NextResponse } from "next/server";
import { PurchaseInvoiceItemService } from "@/server/services/purchase-invoice-item.service";
import { createPurchaseItemSchema } from "@/server/validation/purchase-item.validation";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const result = createPurchaseItemSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Invalid purchase invoice item data",
          details: result.error.issues,
        },
        { status: 400 }
      );
    }

    if (!result.data.purchaseInvoiceId) {
      return NextResponse.json(
        {
          error:
            "purchaseInvoiceId is required for purchase invoice items",
        },
        { status: 400 }
      );
    }

    const purchaseItem =
      await PurchaseInvoiceItemService.createPurchaseInvoiceItem(
        result.data.businessId,
        result.data.purchaseInvoiceId,
        result.data.productId,
        result.data.quantity,
        result.data.unitPrice
      );

    return NextResponse.json(
      {
        purchaseItem,
      },
      { status: 201 }
    );
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
        "Items can only be added to a draft purchase invoice"
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

    console.error(
      "Failed to create purchase invoice item:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to create purchase invoice item",
      },
      { status: 500 }
    );
  }
}