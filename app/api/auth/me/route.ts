import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        business: {
          id: user.business.id,
          name: user.business.name,
          gstin: user.business.gstin,
          businessState: user.business.businessState,
          createdAt: user.business.createdAt,
        },
      },
    });
  } catch (error) {
    console.error("GET /api/auth/me error:", error);
    return NextResponse.json(
      { error: "Failed to load user info" },
      { status: 500 }
    );
  }
}
