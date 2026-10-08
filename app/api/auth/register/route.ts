import { NextResponse } from "next/server";
import { AuthService } from "@/server/services/auth.service";
import { registerSchema } from "@/server/validation/auth.validation";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const result = registerSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Invalid registration data",
          details: result.error.issues,
        },
        { status: 400 }
      );
    }

    const registration = await AuthService.register(
      result.data
    );

    return NextResponse.json(
      {
        registration,
      },
      { status: 201 }
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message ===
        "An account with this email already exists"
    ) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }

    console.error(
      "Failed to register ShopFlow account:",
      error
    );

    return NextResponse.json(
      { error: "Failed to register ShopFlow account" },
      { status: 500 }
    );
  }
}