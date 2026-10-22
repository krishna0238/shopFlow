import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface ImportedRow {
  name?: string;
  sku?: string;
  hsnCode?: string;
  gstRate?: string;
  purchasePrice?: string;
  sellingPrice?: string;
  stockQuantity?: string;
  lowStockThreshold?: string;
  category?: string;
}

function parseCSV(text: string): ImportedRow[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) =>
    h.trim().replace(/^"|"$/g, "")
  );

  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, "").replace(/""/g, '"'));
    const row: ImportedRow = {};
    headers.forEach((header, idx) => {
      (row as Record<string, string>)[header] = values[idx] ?? "";
    });
    return row;
  });
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const text = await file.text();
    const rows = parseCSV(text);

    if (rows.length === 0) {
      return NextResponse.json({ error: "CSV is empty or malformed" }, { status: 400 });
    }

    const results = { created: 0, skipped: 0, errors: [] as string[] };

    for (const row of rows) {
      const name = row.name?.trim();
      if (!name) {
        results.skipped++;
        continue;
      }

      const purchasePrice = parseFloat(row.purchasePrice ?? "0");
      const sellingPrice = parseFloat(row.sellingPrice ?? "0");
      const stockQuantity = parseFloat(row.stockQuantity ?? "0");
      const lowStockThreshold = parseFloat(row.lowStockThreshold ?? "0");
      const gstRate = parseFloat(row.gstRate ?? "0");
      const sku = row.sku?.trim() || undefined;

      if (isNaN(purchasePrice) || isNaN(sellingPrice)) {
        results.errors.push(`Row "${name}": invalid price`);
        results.skipped++;
        continue;
      }

      try {
        // Find or skip if SKU already exists
        if (sku) {
          const existing = await prisma.product.findFirst({
            where: { businessId: user.businessId, sku },
          });
          if (existing) {
            results.skipped++;
            continue;
          }
        }

        // Look up category if provided
        let categoryId: string | undefined;
        if (row.category?.trim()) {
          const cat = await prisma.category.findFirst({
            where: { businessId: user.businessId, name: row.category.trim() },
          });
          categoryId = cat?.id;
        }

        await prisma.product.create({
          data: {
            businessId: user.businessId,
            name,
            sku,
            hsnCode: row.hsnCode?.trim() || undefined,
            gstRate: isNaN(gstRate) ? 0 : gstRate,
            categoryId,
            purchasePrice,
            sellingPrice,
            stockQuantity,
            lowStockThreshold,
          },
        });

        results.created++;
      } catch (err) {
        results.errors.push(`Row "${name}": ${err instanceof Error ? err.message : "unknown error"}`);
        results.skipped++;
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error("POST /api/products/import error:", error);
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}
