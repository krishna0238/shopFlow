import { NextRequest, NextResponse } from "next/server";
import { CategoryService } from "@/app/server/services/category.service";
import { createCategorySchema } from "@/app/server/validation/category.validation";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const businessId = searchParams.get("businessId");

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

    const categories = await CategoryService.getCategories(
      businessId
    );

    return NextResponse.json({
      categories,
    });
  } catch (error) {
    console.error("Failed to load categories:", error);

    return NextResponse.json(
      {
        error: "Failed to load categories",
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

    const result = createCategorySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Invalid category data",
          details: result.error.flatten(),
        },
        {
          status: 400,
        }
      );
    }

    const category = await CategoryService.createCategory(
      result.data
    );

    return NextResponse.json(
      {
        category,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Category already exists"
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

    console.error("Failed to create category:", error);

    return NextResponse.json(
      {
        error: "Failed to create category",
      },
      {
        status: 500,
      }
    );
  }
}