import { NextResponse } from "next/server";
import { PurchaseOrderService } from "@/server/services/purchase-order.service";
import { createPurchaseOrderSchema } from "@/server/validation/purchase-order.validation";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const businessId = searchParams.get("businessId");

  if (!businessId) {
    return NextResponse.json(
      {
        error: "businessId is required",
      },
      { status: 400 }
    );
  }

  try {
    const purchaseOrders =
      await PurchaseOrderService.getPurchaseOrders(businessId);

    return NextResponse.json({
      purchaseOrders,
    });
  } catch (error) {
    console.error("Failed to fetch purchase orders:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch purchase orders",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const result = createPurchaseOrderSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Invalid purchase order data",
          details: result.error.issues,
        },
        { status: 400 }
      );
    }

    const purchaseOrder =
      await PurchaseOrderService.createPurchaseOrder(
        result.data.businessId,
        result.data.supplierId
      );

    return NextResponse.json(
      {
        purchaseOrder,
      },
      { status: 201 }
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Supplier not found"
    ) {
      return NextResponse.json(
        {
          error: error.message,
        },
        { status: 404 }
      );
    }

    console.error("Failed to create purchase order:", error);

    return NextResponse.json(
      {
        error: "Failed to create purchase order",
      },
      { status: 500 }
    );
  }
}