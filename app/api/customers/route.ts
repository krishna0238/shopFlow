
import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { CustomerService } from "@/server/services/customer.service";
import { z } from "zod";

const createCustomerSchema = z.object({
  name: z.string().trim().min(1),
  phone: z.string().trim().min(1).optional(),
  email: z.string().trim().email().optional(),
});

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const customers = await CustomerService.getCustomers(
      user.businessId
    );

    return NextResponse.json({ customers });
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
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

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
      user.businessId,
      result.data.name,
      result.data.phone,
      result.data.email
    );

    return NextResponse.json({ customer }, { status: 201 });
  } catch (error) {
    console.error("Failed to create customer:", error);

    return NextResponse.json(
      { error: "Failed to create customer" },
      { status: 500 }
    );
  }
}
