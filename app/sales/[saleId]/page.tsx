"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type SaleItem = {
  id: string;
  quantity: string | number;
  unitPrice: string | number;
  total: string | number;
  product: {
    id: string;
    name: string;
    sku: string | null;
    hsnCode?: string | null;
    gstRate?: string | number | null;
  };
};

type Sale = {
  id: string;
  subtotal?: string | number | null;
  taxAmount?: string | number | null;
  taxBreakdown?: Record<
    string,
    { rate: number; cgst: number; sgst: number; total: number }
  > | null;
  totalAmount: string | number;
  paymentMode: string;
  createdAt: string;
  customer: {
    id: string;
    name: string;
    phone: string | null;
  } | null;
  items: SaleItem[];
};

export default function SaleDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const saleId = params.saleId as string;

  const [sale, setSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSale = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/sales");

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load sales");
      }

      const foundSale = data.sales.find(
        (item: Sale) => item.id === saleId
      );

      if (!foundSale) {
        throw new Error("Sale not found");
      }

      setSale(foundSale);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load sale"
      );
    } finally {
      setLoading(false);
    }
  }, [saleId, router]);

  useEffect(() => {
    let cancelled = false;

    Promise.resolve().then(() => {
      if (!cancelled && saleId) {
        void loadSale();
      }
    });

    return () => {
      cancelled = true;
    };
  }, [saleId, loadSale]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-100" />
        <div className="shopflow-glass h-64 animate-pulse rounded-2xl" />
      </div>
    );
  }

  if (error || !sale) {
    return (
      <div className="shopflow-glass rounded-3xl p-6 text-red-700">
        <p className="font-semibold">{error || "Sale not found"}</p>
        <Link
          href="/sales"
          className="mt-4 inline-block font-semibold text-[var(--accent)] hover:underline"
        >
          ← Back to Sales
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Action Bar (Hidden when printing) */}
      <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
        <Link
          href="/sales"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--accent)] hover:underline"
        >
          ← Back to Sales
        </Link>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-medium text-white transition hover:bg-[var(--accent-hover)]"
          >
            <span>🖨️</span>
            Print Bill / Invoice
          </button>

          <button
            type="button"
            onClick={() => {
              const billLines = sale.items
                .map(
                  (item) =>
                    `• ${item.product.name} × ${Number(item.quantity)} = ₹${Number(item.total).toFixed(2)}`
                )
                .join("%0A");
              const date = new Date(sale.createdAt).toLocaleDateString(
                "en-IN",
                { dateStyle: "medium" }
              );
              const total = Number(sale.totalAmount).toLocaleString("en-IN", {
                minimumFractionDigits: 2,
              });
              const text = `🧾 *ShopFlow Bill*%0ABill No: ${sale.id.slice(0, 8).toUpperCase()}%0ADate: ${date}%0A%0A${billLines}%0A%0A*Total: ₹${total}*%0APayment: ${sale.paymentMode}%0A%0AThank you for your business!`;
              window.open(`https://wa.me/?text=${text}`, "_blank");
            }}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-medium text-white transition hover:bg-[var(--accent-hover)]"
          >
            <span>💬</span>
            Share on WhatsApp
          </button>

          <button
            type="button"
            onClick={async () => {
              const reason = prompt("Reason for return (optional):");
              if (reason === null) return;
              try {
                const returnItems = sale.items.map((item) => ({
                  saleItemId: item.id,
                  quantity: Number(item.quantity),
                }));
                const res = await fetch(`/api/sales/${sale.id}/return`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    reason: reason || undefined,
                    items: returnItems,
                  }),
                });
                const data = (await res.json()) as {
                  totalRefund?: number;
                  error?: string;
                };
                if (res.ok) {
                  alert(
                    `Return processed successfully. Total refund: ₹${Number(
                      data.totalRefund ?? 0
                    ).toFixed(2)}`
                  );
                  void loadSale();
                } else {
                  alert(`Return failed: ${data.error ?? "Unknown error"}`);
                }
              } catch {
                alert("Network error processing return");
              }
            }}
            className="inline-flex items-center gap-2 rounded-full border border-orange-300 bg-orange-50 px-4 py-2 text-xs font-medium text-orange-700 transition hover:bg-orange-100"
          >
            <span>↩️</span>
            Process Return
          </button>
        </div>
      </div>

      {/* Invoice Document Card */}
      <div className="shopflow-glass overflow-hidden rounded-3xl p-6 sm:p-10 print:border-none print:p-0 print:shadow-none">
        {/* Invoice Header */}
        <div className="flex flex-col justify-between gap-6 border-b border-[var(--border)] pb-8 sm:flex-row sm:items-start">
          <div>
            <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-[10px] font-bold text-[var(--accent)]">
              Tax Invoice / Retail Bill
            </span>
            <h1 className="mt-3 text-[36px] leading-[1.1] text-[var(--text-primary)] sm:text-[40px] leading-[1.1] tracking-[-0.03em]">
              ShopFlow Bill
            </h1>
            <p className="mt-1 font-mono text-xs text-[var(--text-muted)]">
              Invoice #{sale.id.slice(0, 8).toUpperCase()}
            </p>
          </div>

          <div className="text-left sm:text-right">
            <p className="text-xs text-[var(--text-muted)]">Date & Time</p>
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              {new Date(sale.createdAt).toLocaleString("en-IN", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>

            <div className="mt-2 inline-flex items-center gap-2">
              <span className="text-xs text-[var(--text-muted)]">Payment Mode:</span>
              <span className="rounded-lg bg-[var(--accent-soft)] px-2.5 py-1 text-xs font-bold text-[var(--accent)]">
                {sale.paymentMode}
              </span>
            </div>
          </div>
        </div>

        {/* Customer Information */}
        <div className="grid gap-6 border-b border-[var(--border)] py-6 sm:grid-cols-2">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Billed To
            </h3>
            {sale.customer ? (
              <div className="mt-2 space-y-1">
                <p className="font-semibold text-[var(--text-primary)]">
                  {sale.customer.name}
                </p>
                <p className="text-sm text-[var(--text-secondary)]">
                  📞 {sale.customer.phone || "No phone recorded"}
                </p>
                <Link
                  href={`/customers/${sale.customer.id}`}
                  className="inline-block text-xs font-medium text-[var(--accent)] hover:underline print:hidden"
                >
                  View Khata Ledger →
                </Link>
              </div>
            ) : (
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Walk-in Customer (Cash / Counter Sale)
              </p>
            )}
          </div>

          <div className="text-left sm:text-right">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Payment Status
            </h3>
            <p className="mt-2 text-base font-semibold text-emerald-700">
              {sale.paymentMode === "CREDIT" ? "Added to Khata (Credit)" : "Paid in Full"}
            </p>
          </div>
        </div>

        {/* Itemized Line Items Table */}
        <div className="mt-6 overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                <th className="py-3">#</th>
                <th className="py-3">Product Description</th>
                <th className="py-3">SKU</th>
                <th className="py-3 text-right">Qty</th>
                <th className="py-3 text-right">Unit Price</th>
                <th className="py-3 text-right">Total Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {sale.items.map((item, idx) => (
                <tr key={item.id} className="text-[var(--text-primary)]">
                  <td className="py-3 text-xs text-[var(--text-muted)]">
                    {idx + 1}
                  </td>
                  <td className="py-3 font-semibold">
                    {item.product.name}
                  </td>
                  <td className="py-3 font-mono text-xs text-[var(--text-secondary)]">
                    {item.product.sku || "—"}
                  </td>
                  <td className="py-3 text-right font-medium">
                    {Number(item.quantity)}
                  </td>
                  <td className="py-3 text-right font-medium">
                    ₹{Number(item.unitPrice).toFixed(2)}
                  </td>
                  <td className="py-3 text-right font-bold">
                    ₹{Number(item.total).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary & Totals */}
        <div className="mt-8 flex flex-col justify-end gap-3 border-t border-[var(--border)] pt-6 sm:items-end">
          <div className="w-full max-w-xs space-y-2">
            <div className="flex justify-between text-sm text-[var(--text-secondary)]">
              <span>Subtotal</span>
              <span>
                ₹{Number(sale.subtotal ?? sale.totalAmount).toFixed(2)}
              </span>
            </div>
            {sale.taxBreakdown &&
              Object.entries(sale.taxBreakdown).map(([key, t]) => (
                <div
                  key={key}
                  className="space-y-0.5 border-t border-dashed border-[var(--border)] pt-1"
                >
                  <div className="flex justify-between text-xs text-[var(--text-secondary)]">
                    <span>CGST ({Number(t.rate) / 2}%)</span>
                    <span>₹{Number(t.cgst).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-[var(--text-secondary)]">
                    <span>SGST ({Number(t.rate) / 2}%)</span>
                    <span>₹{Number(t.sgst).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            {Number(sale.taxAmount ?? 0) > 0 && (
              <div className="flex justify-between text-sm text-[var(--text-secondary)]">
                <span>Total GST</span>
                <span>₹{Number(sale.taxAmount).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-[var(--border)] pt-3 text-lg font-bold text-[var(--text-primary)]">
              <span>Grand Total</span>
              <span className="text-[var(--accent)]">
                ₹{Number(sale.totalAmount).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-12 text-center text-xs text-[var(--text-muted)]">
          <p>Thank you for your business!</p>
          <p className="mt-1">Generated by ShopFlow Business Operating System</p>
        </div>
      </div>
    </div>
  );
}