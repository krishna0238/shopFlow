import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const inviteSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().email(),
  role: z.enum(["MANAGER", "STAFF"]).default("STAFF"),
  password: z.string().min(6),
});

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (user.role !== "OWNER") {
      return NextResponse.json(
        { error: "Only owners can view staff" },
        { status: 403 }
      );
    }

    const staff = await prisma.user.findMany({
      where: { businessId: user.businessId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ staff });
  } catch (error) {
    console.error("GET /api/settings/staff error:", error);
    return NextResponse.json(
      { error: "Failed to load staff" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (user.role !== "OWNER") {
      return NextResponse.json(
        { error: "Only owners can invite staff" },
        { status: 403 }
      );
    }

    const body = (await request.json()) as unknown;
    const parsed = inviteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({
      where: { email: parsed.data.email },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);

    const newUser = await prisma.user.create({
      data: {
        businessId: user.businessId,
        name: parsed.data.name,
        email: parsed.data.email,
        role: parsed.data.role,
        passwordHash,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ user: newUser }, { status: 201 });
  } catch (error) {
    console.error("POST /api/settings/staff error:", error);
    return NextResponse.json(
      { error: "Failed to invite staff" },
      { status: 500 }
    );
  }
}
