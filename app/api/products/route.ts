import { NextRequest, NextResponse } from "next/server";
import { ProductService } from "@/server/services/product.service";
import {
  createProductSchema,
  deactivateProductSchema,
} from "@/server/validation/product.validation";

export async function GET(request: NextRequest) {
  try {
    const businessId =
      request.nextUrl.searchParams.get("businessId");

    const includeInactive =
      request.nextUrl.searchParams.get("includeInactive") ===
      "true";

    if (!businessId) {
      return NextResponse.json(
        {
          error: "businessId is required",
        },
        {
          status: 400,
        }
      );
    }

    const products = await ProductService.getProducts(
      businessId,
      includeInactive
    );

    return NextResponse.json({
      products,
    });
  } catch (error) {
    console.error("GET /api/products error:", error);

    return NextResponse.json(
      {
        error: "Failed to load products",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const parsed = createProductSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid product data",
          details: parsed.error.flatten(),
        },
        {
          status: 400,
        }
      );
    }

    const product = await ProductService.createProduct(
      parsed.data
    );

    return NextResponse.json(
      {
        product,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message ===
        "A product with this SKU already exists"
    ) {
      return NextResponse.json(
        {
          error: error.message,
        },
        {
          status: 409,
        }
      );
    }

    console.error("POST /api/products error:", error);

    return NextResponse.json(
      {
        error: "Failed to create product",
      },
      {
        status: 500,
      }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    const parsed = deactivateProductSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid deactivation data",
          details: parsed.error.flatten(),
        },
        {
          status: 400,
        }
      );
    }

    const product =
      await ProductService.deactivateProduct(parsed.data);

    return NextResponse.json({
      product,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Active product not found"
    ) {
      return NextResponse.json(
        {
          error: error.message,
        },
        {
          status: 404,
        }
      );
    }

    console.error("PATCH /api/products error:", error);

    return NextResponse.json(
      {
        error: "Failed to deactivate product",
      },
      {
        status: 500,
      }
    );
  }
}
