import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AuditService } from "@/server/services/audit.service";
import { z } from "zod";

const returnSchema = z.object({
  reason: z.string().optional(),
  items: z
    .array(
      z.object({
        saleItemId: z.string().uuid(),
        quantity: z.number().positive(),
      })
    )
    .min(1),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ saleId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { saleId } = await params;
    const body = (await request.json()) as unknown;
    const parsed = returnSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findFirst({
        where: { id: saleId, businessId: user.businessId },
        include: { items: true },
      });
      if (!sale) {
        throw new Error("Sale not found");
      }

      let totalRefund = 0;
      const returnItemsData: Array<{
        productId: string;
        quantity: number;
        unitPrice: number;
        total: number;
      }> = [];

      for (const ri of parsed.data.items) {
        const saleItem = sale.items.find((si) => si.id === ri.saleItemId);
        if (!saleItem) {
          throw new Error(`Sale item ${ri.saleItemId} not found`);
        }
        if (ri.quantity > Number(saleItem.quantity)) {
          throw new Error(`Return quantity exceeds original item quantity`);
        }
        const lineTotal = Number(saleItem.unitPrice) * ri.quantity;
        totalRefund += lineTotal;
        returnItemsData.push({
          productId: saleItem.productId,
          quantity: ri.quantity,
          unitPrice: Number(saleItem.unitPrice),
          total: lineTotal,
        });
      }

      const saleReturn = await tx.saleReturn.create({
        data: {
          businessId: user.businessId,
          saleId,
          reason: parsed.data.reason,
          totalRefund,
          items: {
            create: returnItemsData.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: item.total,
            })),
          },
        },
      });

      // Restore stock and record inventory movement
      for (const ri of returnItemsData) {
        await tx.product.update({
          where: { id: ri.productId },
          data: { stockQuantity: { increment: ri.quantity } },
        });

        await tx.inventoryMovement.create({
          data: {
            businessId: user.businessId,
            productId: ri.productId,
            type: "RETURN",
            quantity: ri.quantity,
            referenceId: saleReturn.id,
            note: `Return for Sale ${saleId.slice(0, 8)}`,
          },
        });
      }

      await AuditService.log(
        {
          businessId: user.businessId,
          action: "SALE_RETURNED",
          entityType: "SaleReturn",
          entityId: saleReturn.id,
          details: {
            saleId,
            totalRefund,
            itemCount: returnItemsData.length,
            reason: parsed.data.reason ?? null,
          },
        },
        tx
      );

      return { saleReturn, totalRefund };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("POST /api/sales/[saleId]/return error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to process return";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
