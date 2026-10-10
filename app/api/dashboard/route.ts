import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { DashboardService } from "@/server/services/dashboard.service";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const summary = await DashboardService.getSummary(
      user.businessId
    );

    return NextResponse.json({
      summary,
    });
  } catch (error) {
    console.error("Failed to fetch dashboard summary:", error);

    return NextResponse.json(
      { error: "Failed to fetch dashboard summary" },
      { status: 500 }
    );
  }
}