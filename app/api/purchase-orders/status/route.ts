import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const updatePurchaseOrderStatusSchema = z.object({
  businessId: z.string().uuid(),
  purchaseOrderId: z.string().uuid(),
  status: z.enum([
    "DRAFT",
    "ORDERED",
    "RECEIVED",
    "CANCELLED",
  ]),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const input =
      updatePurchaseOrderStatusSchema.parse(body);

    const purchaseOrder =
      await prisma.purchaseOrder.findFirst({
        where: {
          id: input.purchaseOrderId,
          businessId: input.businessId,
        },
        select: {
          id: true,
          status: true,
        },
      });

    if (!purchaseOrder) {
      return NextResponse.json(
        {
          error: "Purchase order not found",
        },
        {
          status: 404,
        }
      );
    }

    if (
      purchaseOrder.status ===
      input.status
    ) {
      return NextResponse.json(
        {
          error: `Purchase order is already ${input.status}`,
        },
        {
          status: 409,
        }
      );
    }

    const allowedTransitions: Record<
      string,
      string[]
    > = {
      DRAFT: [
        "ORDERED",
        "CANCELLED",
      ],
      ORDERED: [
        "RECEIVED",
        "CANCELLED",
      ],
      RECEIVED: [],
      CANCELLED: [],
    };

    const allowedNextStatuses =
      allowedTransitions[
        purchaseOrder.status
      ] ?? [];

    if (
      !allowedNextStatuses.includes(
        input.status
      )
    ) {
      return NextResponse.json(
        {
          error: `Cannot change purchase order status from ${purchaseOrder.status} to ${input.status}`,
        },
        {
          status: 409,
        }
      );
    }

    const updatedPurchaseOrder =
      await prisma.purchaseOrder.update({
        where: {
          id: purchaseOrder.id,
        },
        data: {
          status: input.status,
        },
        select: {
          id: true,
          businessId: true,
          supplierId: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      });

    return NextResponse.json({
      purchaseOrder:
        updatedPurchaseOrder,
    });
  } catch (error) {
    console.error(
      "Failed to update purchase order status:",
      error
    );

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid purchase order status request",
          details: error.flatten(),
        },
        {
          status: 400,
        }
      );
    }

    return NextResponse.json(
      {
        error:
          "Failed to update purchase order status",
      },
      {
        status: 500,
      }
    );
  }
}