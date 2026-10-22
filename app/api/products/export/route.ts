import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const products = await prisma.product.findMany({
      where: { businessId: user.businessId },
      include: { category: true },
      orderBy: { name: "asc" },
    });

    const headers = ["name", "sku", "hsnCode", "gstRate", "purchasePrice", "sellingPrice", "stockQuantity", "lowStockThreshold", "category", "isActive"];

    const rows = products.map((p) => [
      p.name,
      p.sku ?? "",
      p.hsnCode ?? "",
      String(Number(p.gstRate ?? 0)),
      String(Number(p.purchasePrice)),
      String(Number(p.sellingPrice)),
      String(Number(p.stockQuantity)),
      String(Number(p.lowStockThreshold)),
      p.category?.name ?? "",
      p.isActive ? "true" : "false",
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="shopflow-products-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("GET /api/products/export error:", error);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
