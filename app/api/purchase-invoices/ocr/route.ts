import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Tesseract from "tesseract.js";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No invoice image uploaded" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Run Tesseract OCR on the image buffer
    const {
      data: { text },
    } = await Tesseract.recognize(buffer, "eng");

    // Extract Invoice Number
    let invoiceNumber: string | null = null;
    const invMatch =
      text.match(
        /(?:Invoice\s*No\.?|Invoice\s*#|Inv\s*#|Bill\s*No\.?|Bill\s*#|Tax\s*Invoice\s*No\.?)[:\s]*([A-Za-z0-9\-_/]+)/i
      ) || text.match(/\b([A-Z]{2,4}[-/]\d{3,}[-/]?\d*)\b/);

    if (invMatch) {
      invoiceNumber = invMatch[1].trim();
    }

    // Extract Date
    let invoiceDate: string | null = null;
    const dateMatch =
      text.match(
        /(?:Date|Dated|Invoice\s*Date)[:\s]*([0-9]{1,2}[-/][0-9]{1,2}[-/][0-9]{2,4})/i
      ) || text.match(/\b([0-9]{1,2}[-/][0-9]{1,2}[-/][0-9]{2,4})\b/);

    if (dateMatch) {
      const parts = dateMatch[1].split(/[-/]/);
      if (parts.length === 3) {
        let year = parseInt(parts[2], 10);
        if (year < 100) year += 2000;
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[0], 10);
        const d = new Date(year, month, day);
        if (!isNaN(d.getTime())) {
          invoiceDate = d.toISOString().split("T")[0];
        }
      }
    }

    // Extract Total Amount
    let totalAmount: number | null = null;
    const amountMatch =
      text.match(
        /(?:Grand\s*Total|Total\s*Amount|Net\s*Amount|Total|Bill\s*Total)[:\s]*(?:₹|Rs\.?|INR)?\s*([0-9,]+\.?[0-9]*)/i
      ) ||
      text.match(/(?:₹|Rs\.?)\s*([0-9,]+\.?[0-9]*)/i);

    if (amountMatch) {
      const cleanNum = parseFloat(amountMatch[1].replace(/,/g, ""));
      if (!isNaN(cleanNum)) {
        totalAmount = cleanNum;
      }
    }

    // Fuzzy match supplier name from existing suppliers in this business
    const suppliers = await prisma.supplier.findMany({
      where: { businessId: user.businessId },
      select: { id: true, name: true },
    });

    let matchedSupplier: { id: string; name: string } | null = null;
    const lowerText = text.toLowerCase();

    for (const s of suppliers) {
      if (lowerText.includes(s.name.toLowerCase())) {
        matchedSupplier = s;
        break;
      }
    }

    return NextResponse.json({
      success: true,
      extracted: {
        invoiceNumber,
        invoiceDate: invoiceDate ?? new Date().toISOString().split("T")[0],
        totalAmount,
        supplierId: matchedSupplier?.id ?? null,
        supplierName: matchedSupplier?.name ?? null,
        rawTextLength: text.length,
      },
    });
  } catch (error) {
    console.error("POST /api/purchase-invoices/ocr error:", error);
    return NextResponse.json(
      { error: "OCR processing failed" },
      { status: 500 }
    );
  }
}
