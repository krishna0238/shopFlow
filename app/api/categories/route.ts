
import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { CategoryService } from "@/app/server/services/category.service";
import { createCategorySchema } from "@/app/server/validation/category.validation";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const categories = await CategoryService.getCategories(
      user.businessId
    );

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Failed to load categories:", error);

    return NextResponse.json(
      { error: "Failed to load categories" },
      { status: 500 }
    );
  }
}

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
    const result = createCategorySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Invalid category data",
          details: result.error.flatten(),
        },
        { status: 400 }
      );
    }

    const category = await CategoryService.createCategory(
      user.businessId,
      result.data
    );

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Category already exists"
    ) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }

    console.error("Failed to create category:", error);

    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}
