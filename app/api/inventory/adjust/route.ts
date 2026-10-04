import { NextResponse } from "next/server";
import { z } from "zod";
import { InventoryService } from "@/server/services/inventory.service";

const adjustStockSchema = z.object({
  businessId: z.string().uuid(),
  productId: z.string().uuid(),
  quantity: z.number(),
  note: z.string().trim().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const result = adjustStockSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Invalid stock adjustment data",
        },
        { status: 400 }
      );
    }

    const movement = await InventoryService.adjustStock(
      result.data.businessId,
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