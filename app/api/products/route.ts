import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { ProductService } from "@/server/services/product.service";
import {
  createProductSchema,
  deactivateProductSchema,
} from "@/server/validation/product.validation";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const includeInactive =
      request.nextUrl.searchParams.get("includeInactive") ===
      "true";

    const products = await ProductService.getProducts(
      user.businessId,
      includeInactive
    );

    return NextResponse.json({ products });
  } catch (error) {
    console.error("GET /api/products error:", error);

    return NextResponse.json(
      { error: "Failed to load products" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const parsed = createProductSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid product data",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const product = await ProductService.createProduct({
      ...parsed.data,
      businessId: user.businessId,
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "A product with this SKU already exists"
    ) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }

    console.error("POST /api/products error:", error);

    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const parsed = deactivateProductSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid deactivation data",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const product = await ProductService.deactivateProduct({
      ...parsed.data,
      businessId: user.businessId,
    });

    return NextResponse.json({ product });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Active product not found"
    ) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    console.error("PATCH /api/products error:", error);

    return NextResponse.json(
      { error: "Failed to deactivate product" },
      { status: 500 }
    );
  }
}