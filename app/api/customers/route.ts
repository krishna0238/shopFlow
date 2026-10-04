import { NextResponse } from "next/server";
import { CustomerService } from "@/server/services/customer.service";
import { z } from "zod";

const createCustomerSchema = z.object({
  businessId: z.string().uuid(),
  name: z.string().trim().min(1),
  phone: z.string().trim().min(1).optional(),
  email: z.string().trim().email().optional(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const businessId = searchParams.get("businessId");

  if (!businessId) {
    return NextResponse.json(
      { error: "businessId is required" },
      { status: 400 }
    );
  }

  const businessIdValidation = z.string().uuid().safeParse(businessId);

  if (!businessIdValidation.success) {
    return NextResponse.json(
      { error: "Invalid businessId" },
      { status: 400 }
    );
  }

  try {
    const customers = await CustomerService.getCustomers(businessId);

    return NextResponse.json({
      customers,
    });
  } catch (error) {
    console.error("Failed to fetch customers:", error);

    return NextResponse.json(
      { error: "Failed to fetch customers" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const result = createCustomerSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Invalid customer data",
          details: result.error.issues,
        },
        { status: 400 }
      );
    }

    const customer = await CustomerService.createCustomer(
      result.data.businessId,
      result.data.name,
      result.data.phone,
      result.data.email
    );

    return NextResponse.json(
      {
        customer,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create customer:", error);

    return NextResponse.json(
      { error: "Failed to create customer" },
      { status: 500 }
    );
  }
}