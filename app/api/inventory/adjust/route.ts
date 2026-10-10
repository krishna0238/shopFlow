import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { InventoryService } from "@/server/services/inventory.service";

const adjustStockSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number(),
  note: z.string().trim().optional(),
});

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const result = adjustStockSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Invalid stock adjustment data",
          details: result.error.flatten(),
        },
        { status: 400 }
      );
    }

    const movement = await InventoryService.adjustStock(
      user.businessId,
      result.data.productId,
      result.data.quantity,
      result.data.note
    );

    return NextResponse.json(
      {
        message: "Stock adjusted successfully",
        product: movement.product,
        movement: movement.movement,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to adjust stock:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Failed to adjust stock";

    if (message === "Product not found") {
      return NextResponse.json(
        { error: message },
        { status: 404 }
      );
    }

    if (message === "Stock quantity cannot become negative") {
      return NextResponse.json(
        { error: message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to adjust stock" },
      { status: 500 }
    );
  }
}