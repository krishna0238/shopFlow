
import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { SupplierService } from "@/server/services/supplier.service";
import { createSupplierSchema } from "@/server/validation/supplier.validation";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const suppliers = await SupplierService.getSuppliers(
      user.businessId
    );

    return NextResponse.json({ suppliers });
  } catch (error) {
    console.error("Failed to fetch suppliers:", error);

    return NextResponse.json(
      { error: "Failed to fetch suppliers" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const body: unknown = await request.json();

    // The authenticated session determines the supplier's business.
    // Validate only supplier fields; never trust a client-supplied businessId.
    const supplierData =
      body !== null &&
      typeof body === "object" &&
      !Array.isArray(body)
        ? Object.fromEntries(
            Object.entries(body).filter(
              ([key]) => key !== "businessId"
            )
          )
        : {};

    const result = createSupplierSchema
      .omit({ businessId: true })
      .safeParse(supplierData);

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
      user.businessId,
      result.data.name,
      result.data.phone,
      result.data.email,
      result.data.address
    );

    return NextResponse.json({ supplier }, { status: 201 });
  } catch (error) {
    console.error("Failed to create supplier:", error);

    return NextResponse.json(
      { error: "Failed to create supplier" },
      { status: 500 }
    );
  }
}
