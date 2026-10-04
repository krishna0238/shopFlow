import { NextResponse } from "next/server";
import { PurchaseItemService } from "@/server/services/purchase-item.service";
import { createPurchaseItemSchema } from "@/server/validation/purchase-item.validation";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const businessId = searchParams.get("businessId");
  const purchaseOrderId = searchParams.get("purchaseOrderId");

  if (!businessId || !purchaseOrderId) {
    return NextResponse.json(
      {
        error:
          "businessId and purchaseOrderId are required",
      },
      { status: 400 }
    );
  }

  try {
    const purchaseItems =
      await PurchaseItemService.getPurchaseOrderItems(
        businessId,
        purchaseOrderId
      );

    return NextResponse.json(
      {
        purchaseItems,
      },
      { status: 200 }
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Purchase order not found"
    ) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    console.error(
      "Failed to fetch purchase order items:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to fetch purchase order items",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const result = createPurchaseItemSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Invalid purchase item data",
          details: result.error.issues,
        },
        { status: 400 }
      );
    }

    if (!result.data.purchaseOrderId) {
      return NextResponse.json(
        {
          error:
            "purchaseOrderId is required for purchase order items",
        },
        { status: 400 }
      );
    }

    const purchaseItem =
      await PurchaseItemService.createPurchaseItem(
        result.data.businessId,
        result.data.purchaseOrderId,
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
      error.message === "Purchase order not found"
    ) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    if (
      error instanceof Error &&
      error.message ===
        "Items can only be added to a draft purchase order"
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

    console.error("Failed to create purchase item:", error);

    return NextResponse.json(
      {
        error: "Failed to create purchase item",
      },
      { status: 500 }
    );
  }
}