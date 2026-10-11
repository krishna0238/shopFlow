
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AuditService } from "@/server/services/audit.service";

const updatePurchaseOrderStatusSchema = z.object({
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
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const input = updatePurchaseOrderStatusSchema.parse(body);

    const result = await prisma.$transaction(async (tx) => {
      const lockedOrders = await tx.$queryRaw<
        Array<{ id: string }>
      >`
        SELECT "id"
        FROM "purchase_orders"
        WHERE "id" = ${input.purchaseOrderId}
          AND "businessId" = ${user.businessId}
        FOR UPDATE
      `;

      if (lockedOrders.length === 0) {
        throw new Error("Purchase order not found");
      }

      const purchaseOrder = await tx.purchaseOrder.findFirst({
        where: {
          id: input.purchaseOrderId,
          businessId: user.businessId,
        },
        select: {
          id: true,
          businessId: true,
          supplierId: true,
          status: true,
        },
      });

      if (!purchaseOrder) {
        throw new Error("Purchase order not found");
      }

      if (purchaseOrder.status === input.status) {
        throw new Error(
          `Purchase order is already ${input.status}`
        );
      }

      const allowedTransitions: Record<string, string[]> = {
        DRAFT: ["ORDERED", "CANCELLED"],
        ORDERED: ["RECEIVED", "CANCELLED"],
        RECEIVED: [],
        CANCELLED: [],
      };

      const allowedNextStatuses =
        allowedTransitions[purchaseOrder.status] ?? [];

      if (!allowedNextStatuses.includes(input.status)) {
        throw new Error(
          `Cannot change purchase order status from ${purchaseOrder.status} to ${input.status}`
        );
      }

      const previousStatus = purchaseOrder.status;

      const updatedPurchaseOrder = await tx.purchaseOrder.update({
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

      await AuditService.log(
        {
          businessId: user.businessId,
          userId: user.id,
          action: "PURCHASE_ORDER_STATUS_CHANGED",
          entityType: "PurchaseOrder",
          entityId: purchaseOrder.id,
          details: {
            supplierId: purchaseOrder.supplierId,
            previousStatus,
            newStatus: input.status,
          },
        },
        tx
      );

      return updatedPurchaseOrder;
    });

    return NextResponse.json({
      purchaseOrder: result,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Purchase order not found"
    ) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    if (
      error instanceof Error &&
      (
        error.message.startsWith("Purchase order is already ") ||
        error.message.startsWith("Cannot change purchase order status")
      )
    ) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid purchase order status request",
          details: error.flatten(),
        },
        { status: 400 }
      );
    }

    console.error(
      "Failed to update purchase order status:",
      error
    );

    return NextResponse.json(
      { error: "Failed to update purchase order status" },
      { status: 500 }
    );
  }
}
