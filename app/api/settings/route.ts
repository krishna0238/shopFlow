import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const settingsSchema = z.object({
  name: z.string().trim().min(1).optional(),
  gstin: z.string().trim().max(15).optional(),
  businessState: z.string().trim().optional(),
});

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (user.role !== "OWNER") {
      return NextResponse.json(
        { error: "Only owners can update business settings" },
        { status: 403 }
      );
    }

    const body = (await request.json()) as unknown;
    const parsed = settingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updated = await prisma.business.update({
      where: { id: user.businessId },
      data: {
        name: parsed.data.name,
        gstin: parsed.data.gstin,
        businessState: parsed.data.businessState,
      },
    });

    return NextResponse.json({ business: updated });
  } catch (error) {
    console.error("PATCH /api/settings error:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
