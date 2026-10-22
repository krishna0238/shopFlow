import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AuditService } from "@/server/services/audit.service";
import { z } from "zod";

const paymentSchema = z.object({
  amount: z.number().positive(),
  paymentMode: z.enum(["CASH", "UPI", "BANK", "CHEQUE"]).default("CASH"),
  note: z.string().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ supplierId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { supplierId } = await params;

    const supplier = await prisma.supplier.findFirst({
      where: { id: supplierId, businessId: user.businessId },
    });
    if (!supplier) {
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
    }

    const [payments, invoices] = await Promise.all([
      prisma.supplierPayment.findMany({
        where: { supplierId, businessId: user.businessId },
        orderBy: { createdAt: "desc" },
      }),
      prisma.purchaseInvoice.findMany({
        where: { supplierId, businessId: user.businessId, status: "CONFIRMED" },
        select: { totalAmount: true },
      }),
    ]);

    const totalPurchased = invoices.reduce(
      (sum, inv) => sum + Number(inv.totalAmount),
      0
    );
    const totalPaid = payments.reduce(
      (sum, p) => sum + Number(p.amount),
      0
    );
    const outstanding = totalPurchased - totalPaid;

    return NextResponse.json({
      supplier,
      payments,
      totalPurchased,
      totalPaid,
      outstanding,
    });
  } catch (error) {
    console.error("GET supplier payments error:", error);
    return NextResponse.json(
      { error: "Failed to load supplier payments" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ supplierId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { supplierId } = await params;
    const body = (await request.json()) as unknown;
    const parsed = paymentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const supplier = await prisma.supplier.findFirst({
      where: { id: supplierId, businessId: user.businessId },
    });
    if (!supplier) {
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 });
    }

    const payment = await prisma.$transaction(async (tx) => {
      const p = await tx.supplierPayment.create({
        data: {
          businessId: user.businessId,
          supplierId,
          amount: parsed.data.amount,
          paymentMode: parsed.data.paymentMode,
          note: parsed.data.note,
        },
      });

      await AuditService.log(
        {
          businessId: user.businessId,
          action: "SUPPLIER_PAYMENT_RECORDED",
          entityType: "SupplierPayment",
          entityId: p.id,
          details: {
            supplierId,
            amount: parsed.data.amount,
            paymentMode: parsed.data.paymentMode,
            note: parsed.data.note ?? null,
          },
        },
        tx
      );

      return p;
    });

    return NextResponse.json({ payment }, { status: 201 });
  } catch (error) {
    console.error("POST supplier payment error:", error);
    return NextResponse.json(
      { error: "Failed to record payment" },
      { status: 500 }
    );
  }
}
