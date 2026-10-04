import { NextResponse } from "next/server";
import { CreditService } from "@/server/services/credit.service";
import { createCreditTransactionSchema } from "@/server/validation/credit.validation";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const businessId = searchParams.get("businessId");
  const customerId = searchParams.get("customerId");

  if (!businessId) {
    return NextResponse.json(
      {
        error: "businessId is required",
      },
      { status: 400 }
    );
  }

  if (!customerId) {
    return NextResponse.json(
      {
        error: "customerId is required",
      },
      { status: 400 }
    );
  }

  try {
    const result = await CreditService.getCustomerBalance(
      businessId,
      customerId
    );

    return NextResponse.json(result);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Customer not found"
    ) {
      return NextResponse.json(
        {
          error: error.message,
        },
        { status: 404 }
      );
    }

    console.error("Failed to fetch customer credit:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch customer credit",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const result =
      createCreditTransactionSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Invalid credit transaction data",
          details: result.error.issues,
        },
        { status: 400 }
      );
    }

    const transaction =
      await CreditService.createTransaction(result.data);

    return NextResponse.json(
      {
        transaction,
      },
      { status: 201 }
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Customer not found"
    ) {
      return NextResponse.json(
        {
          error: error.message,
        },
        { status: 404 }
      );
    }

    if (
      error instanceof Error &&
      error.message ===
        "Payment cannot exceed outstanding credit"
    ) {
      return NextResponse.json(
        {
          error: error.message,
        },
        { status: 409 }
      );
    }

    console.error(
      "Failed to create credit transaction:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to create credit transaction",
      },
      { status: 500 }
    );
  }
}