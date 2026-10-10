
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { PurchaseOrderService } from "@/server/services/purchase-order.service";
import { createPurchaseOrderSchema } from "@/server/validation/purchase-order.validation";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const purchaseOrders =
      await PurchaseOrderService.getPurchaseOrders(
        user.businessId
      );

    return NextResponse.json({ purchaseOrders });
  } catch (error) {
    console.error("Failed to fetch purchase orders:", error);

    return NextResponse.json(
      { error: "Failed to fetch purchase orders" },
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
        user.businessId,
        result.data.supplierId
      );

    return NextResponse.json(
      { purchaseOrder },
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

    console.error("Failed to create purchase order:", error);

    return NextResponse.json(
      { error: "Failed to create purchase order" },
      { status: 500 }
    );
  }
}
