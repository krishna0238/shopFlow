import { NextResponse } from "next/server";
import { InventoryService } from "@/server/services/inventory.service";
import { z } from "zod";

const querySchema = z.object({
  businessId: z.string().uuid(),
  productId: z.string().uuid(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const result = querySchema.safeParse({
    businessId: searchParams.get("businessId"),
    productId: searchParams.get("productId"),
  });

  if (!result.success) {
    return NextResponse.json(
      {
        error: "Invalid businessId or productId",
      },
      { status: 400 }
    );
  }

  try {
    const movements = await InventoryService.getProductMovements(
      result.data.businessId,
      result.data.productId
    );

    return NextResponse.json({ movements });
  } catch (error) {
    console.error("Failed to fetch inventory movements:", error);

    return NextResponse.json(
      { error: "Failed to fetch inventory movements" },
      { status: 500 }
    );
  }
}