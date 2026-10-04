import { NextResponse } from "next/server";
import { SupplierService } from "@/server/services/supplier.service";
import { createSupplierSchema } from "@/server/validation/supplier.validation";

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
    const suppliers = await SupplierService.getSuppliers(businessId);

    return NextResponse.json({
      suppliers,
    });
  } catch (error) {
    console.error("Failed to fetch suppliers:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch suppliers",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const result = createSupplierSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Invalid supplier data",
          details: result.error.issues,
        },
        { status: 400 }
      );
    }

    const supplier = await SupplierService.createSupplier(
      result.data.businessId,
      result.data.name,
      result.data.phone,
      result.data.email,
      result.data.address
    );

    return NextResponse.json(
      {
        supplier,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create supplier:", error);

    return NextResponse.json(
      {
        error: "Failed to create supplier",
      },
      { status: 500 }
    );
  }
}