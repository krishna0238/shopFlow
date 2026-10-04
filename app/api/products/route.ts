import { NextResponse } from "next/server";
import { ProductService } from "@/server/services/product.service";
import { createProductSchema } from "@/server/validation/product.validation";

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
    const products = await ProductService.getProducts(businessId);

    return NextResponse.json({
      products,
    });
  } catch (error) {
    console.error("Failed to fetch products:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch products",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const result = createProductSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Invalid product data",
          details: result.error.issues,
        },
        { status: 400 }
      );
    }

    const product = await ProductService.createProduct(result.data);

    return NextResponse.json(
      {
        product,
      },
      { status: 201 }
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "A product with this SKU already exists"
    ) {
      return NextResponse.json(
        {
          error: error.message,
        },
        { status: 409 }
      );
    }

    console.error("Failed to create product:", error);

    return NextResponse.json(
      {
        error: "Failed to create product",
      },
      { status: 500 }
    );
  }
}