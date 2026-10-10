import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { InventoryService } from "@/server/services/inventory.service";
import { z } from "zod";

const querySchema = z.object({
  productId: z.string().uuid(),
});

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);

    const result = querySchema.safeParse({
      productId: searchParams.get("productId"),
    });

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid productId" },
        { status: 400 }
      );
    }

    const movements = await InventoryService.getProductMovements(
      user.businessId,
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