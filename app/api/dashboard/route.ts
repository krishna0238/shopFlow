import { NextResponse } from "next/server";
import { DashboardService } from "@/server/services/dashboard.service";

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
    const summary = await DashboardService.getSummary(businessId);

    return NextResponse.json({
      summary,
    });
  } catch (error) {
    console.error("Failed to fetch dashboard summary:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch dashboard summary",
      },
      { status: 500 }
    );
  }
}