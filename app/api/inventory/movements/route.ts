import { NextResponse } from "next/server";
import { InventoryService } from "@/server/services/inventory.service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const businessId = searchParams.get("businessId");
  const productId = searchParams.get("productId");

  if (!businessId) {
    return NextResponse.json(
      {
        error: "businessId is required",
      },
      { status: 400 }
    );
  }

  if (!productId) {
    return NextResponse.json(
      {
        error: "productId is required",
      },
      { status: 400 }
    );
  }

  try {
    const movements = await InventoryService.getProductMovements(
      businessId,
      productId
    );

    return NextResponse.json({
      movements,
    });
  } catch (error) {
    console.error("Failed to fetch inventory movements:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch inventory movements",
      },
      { status: 500 }
    );
  }
}