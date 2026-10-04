import { NextResponse } from "next/server";
import { PurchaseInvoiceService } from "@/server/services/purchase-invoice.service";
import {
  createPurchaseInvoiceSchema,
  confirmPurchaseInvoiceSchema,
} from "@/server/validation/purchase-invoice.validation";

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
    const purchaseInvoices =
      await PurchaseInvoiceService.getPurchaseInvoices(businessId);

    return NextResponse.json({
      purchaseInvoices,
    });
  } catch (error) {
    console.error("Failed to fetch purchase invoices:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch purchase invoices",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const result = createPurchaseInvoiceSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Invalid purchase invoice data",
          details: result.error.issues,
        },
        { status: 400 }
      );
    }

    const purchaseInvoice =
      await PurchaseInvoiceService.createPurchaseInvoice(
        result.data.businessId,
        result.data.supplierId,
        result.data.invoiceNumber,
        result.data.invoiceDate,
        result.data.totalAmount
      );

    return NextResponse.json(
      {
        purchaseInvoice,
      },
      { status: 201 }
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Supplier not found"
    ) {
      return NextResponse.json(
        {
          error: error.message,
        },
        { status: 404 }
      );
    }

    console.error("Failed to create purchase invoice:", error);

    return NextResponse.json(
      {
        error: "Failed to create purchase invoice",
      },
      { status: 500 }
    );
  }
}