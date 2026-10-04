import { NextResponse } from "next/server";
import { SaleService } from "@/server/services/sale.service";
import { createSaleSchema } from "@/server/validation/sale.validation";

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
    const sales = await SaleService.getSales(businessId);

    return NextResponse.json({
      sales,
    });
  } catch (error) {
    console.error("Failed to fetch sales:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch sales",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const result = createSaleSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Invalid sale data",
          details: result.error.issues,
        },
        { status: 400 }
      );
    }

    const sale = await SaleService.createSale(result.data);

    return NextResponse.json(
      {
        sale,
      },
      { status: 201 }
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Customer is required for credit sales"
    ) {
      return NextResponse.json(
        {
          error: error.message,
        },
        { status: 409 }
      );
    }

    if (
      error instanceof Error &&
      error.message === "Customer not found"
    ) {
      return NextResponse.json(
        {
          error: error.message,
        },
        { status: 404 }
      );
    }

    if (
      error instanceof Error &&
      error.message === "Product not found"
    ) {
      return NextResponse.json(
        {
          error: error.message,
        },
        { status: 404 }
      );
    }

    if (
      error instanceof Error &&
      error.message.startsWith("Insufficient stock for product:")
    ) {
      return NextResponse.json(
        {
          error: error.message,
        },
        { status: 409 }
      );
    }

    console.error("Failed to create sale:", error);

    return NextResponse.json(
      {
        error: "Failed to create sale",
      },
      { status: 500 }
    );
  }
}