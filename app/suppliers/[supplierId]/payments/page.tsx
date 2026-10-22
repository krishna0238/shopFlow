"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type Payment = {
  id: string;
  amount: string | number;
  paymentMode: string;
  note: string | null;
  createdAt: string;
};

type Supplier = {
  id: string;
  name: string;
  phone: string | null;
};

type PayablesData = {
  supplier: Supplier;
  payments: Payment[];
  totalPurchased: number;
  totalPaid: number;
  outstanding: number;
};

export default function SupplierPaymentsPage() {
  const params = useParams();
  const router = useRouter();
  const supplierId = params.supplierId as string;

  const [data, setData] = useState<PayablesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState<"CASH" | "UPI" | "BANK" | "CHEQUE">("CASH");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`/api/suppliers/${supplierId}/payments`);
      if (res.status === 401) {
        router.replace("/login");
        return;
      }
      if (!res.ok) {
        throw new Error("Failed to load vendor payables");
      }
      const json = (await res.json()) as PayablesData;
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading payables");
    } finally {
      setLoading(false);
    }
  }, [supplierId, router]);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) {
        void loadData();
      }
    });
    return () => {
      cancelled = true;
    };
  }, [loadData]);

  async function handleRecordPayment(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    const parsedAmount = Number(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      setFormError("Please enter a valid positive payment amount.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/suppliers/${supplierId}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parsedAmount,
          paymentMode: mode,
          note: note.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const d = (await res.json()) as { error?: string };
        throw new Error(d.error ?? "Failed to record payment");
      }
      setAmount("");
      setNote("");
      await loadData();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Failed to record payment"
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-100" />
        <div className="shopflow-glass h-64 animate-pulse rounded-2xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="shopflow-glass rounded-3xl p-6 text-red-700">
        <p className="font-semibold">{error || "Failed to load data"}</p>
        <Link
          href={`/suppliers/${supplierId}`}
          className="mt-4 inline-block font-semibold text-[var(--accent)] hover:underline"
        >
          ← Back to Supplier
        </Link>
      </div>
    );
  }

  const supplierPhone = data.supplier?.phone
    ? data.supplier.phone.replace(/[^0-9]/g, "")
    : "";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href={`/suppliers/${supplierId}`}
            className="text-xs font-semibold text-[var(--accent)] hover:underline"
          >
            ← Back to {data.supplier.name}
          </Link>
          <h1 className="mt-2 text-[36px] leading-[1.1] text-[var(--text-primary)] sm:text-[40px] leading-[1.1] tracking-[-0.03em]">
            Vendor Khata: {data.supplier.name}
          </h1>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Supplier payables ledger, payment receipts, and balance settlement
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              const text = `🤝 *ShopFlow Vendor Khata Summary*%0ASupplier: ${data.supplier.name}%0ATotal Purchased: ₹${Number(data.totalPurchased).toFixed(2)}%0ATotal Paid: ₹${Number(data.totalPaid).toFixed(2)}%0A*Outstanding Balance: ₹${Number(data.outstanding).toFixed(2)}*%0A%0AThank you!`;
              const url = supplierPhone
                ? `https://wa.me/${supplierPhone}?text=${text}`
                : `https://wa.me/?text=${text}`;
              window.open(url, "_blank");
            }}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-4 py-2.5 text-xs font-medium text-white transition hover:bg-[var(--accent-hover)]"
          >
            <span>💬</span>
            Share Khata on WhatsApp
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="shopflow-glass rounded-3xl p-5">
          <span className="text-xs text-[var(--text-muted)]">Total Invoiced</span>
          <p className="mt-1 text-2xl font-bold text-[var(--text-primary)]">
            ₹
            {Number(data.totalPurchased).toLocaleString("en-IN", {
              minimumFractionDigits: 2,
            })}
          </p>
          <p className="mt-1 text-[11px] text-[var(--text-muted)]">
            From confirmed purchase invoices
          </p>
        </div>

        <div className="shopflow-glass rounded-3xl p-5">
          <span className="text-xs text-[var(--text-muted)]">Total Paid</span>
          <p className="mt-1 text-2xl font-bold text-emerald-700">
            ₹
            {Number(data.totalPaid).toLocaleString("en-IN", {
              minimumFractionDigits: 2,
            })}
          </p>
          <p className="mt-1 text-[11px] text-[var(--text-muted)]">
            Cleared vendor payments
          </p>
        </div>

        <div className="shopflow-glass rounded-3xl p-5">
          <span className="text-xs text-[var(--text-muted)]">
            Outstanding Payable
          </span>
          <p
            className={`mt-1 text-2xl font-bold ${
              data.outstanding > 0 ? "text-red-600" : "text-emerald-700"
            }`}
          >
            ₹
            {Number(data.outstanding).toLocaleString("en-IN", {
              minimumFractionDigits: 2,
            })}
          </p>
          <p className="mt-1 text-[11px] text-[var(--text-muted)]">
            {data.outstanding > 0 ? "Balance due to vendor" : "Fully settled"}
          </p>
        </div>
      </div>

      {/* Record Payment Form */}
      <section className="shopflow-glass rounded-3xl p-6">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">
          Record Payment to Vendor
        </h2>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Log cash, UPI, bank transfer, or cheque settlements paid to this supplier
        </p>

        <form onSubmit={handleRecordPayment} className="mt-5 grid gap-4 sm:grid-cols-3">
          <div>
            <label
              htmlFor="paymentAmount"
              className="mb-1 block text-xs font-medium text-[var(--text-secondary)]"
            >
              Amount Paid (₹) *
            </label>
            <input
              id="paymentAmount"
              type="number"
              min="0.01"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-white/60 px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
              placeholder="e.g. 5000.00"
            />
          </div>

          <div>
            <label
              htmlFor="paymentMode"
              className="mb-1 block text-xs font-medium text-[var(--text-secondary)]"
            >
              Payment Mode
            </label>
            <select
              id="paymentMode"
              value={mode}
              onChange={(e) =>
                setMode(
                  e.target.value as "CASH" | "UPI" | "BANK" | "CHEQUE"
                )
              }
              className="w-full rounded-xl border border-[var(--border)] bg-white/60 px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
            >
              <option value="CASH">Cash</option>
              <option value="UPI">UPI / QR</option>
              <option value="BANK">Bank Transfer (NEFT/RTGS)</option>
              <option value="CHEQUE">Cheque</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="paymentNote"
              className="mb-1 block text-xs font-medium text-[var(--text-secondary)]"
            >
              Reference / Note (Optional)
            </label>
            <input
              id="paymentNote"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-white/60 px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
              placeholder="e.g. UTR / Inv #402"
            />
          </div>

          {formError && (
            <p className="col-span-full text-xs font-semibold text-red-600">
              {formError}
            </p>
          )}

          <div className="col-span-full pt-1">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-xs font-medium text-white transition hover:bg-[var(--accent-hover)] disabled:opacity-50"
            >
              {saving ? "Recording..." : "Record Payment"}
            </button>
          </div>
        </form>
      </section>

      {/* Payment History */}
      <section className="shopflow-glass rounded-3xl p-6">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">
          Payment Transactions
        </h2>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          History of all recorded payments made to {data.supplier.name}
        </p>

        <div className="mt-5 overflow-x-auto">
          {data.payments.length === 0 ? (
            <p className="text-xs text-[var(--text-secondary)]">
              No payments recorded yet for this supplier.
            </p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  <th className="py-2.5">Date</th>
                  <th className="py-2.5">Mode</th>
                  <th className="py-2.5">Reference Note</th>
                  <th className="py-2.5 text-right">Amount Paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {data.payments.map((p) => (
                  <tr key={p.id} className="text-xs text-[var(--text-primary)]">
                    <td className="py-3 text-[var(--text-secondary)]">
                      {new Date(p.createdAt).toLocaleDateString("en-IN", {
                        dateStyle: "medium",
                      })}
                    </td>
                    <td className="py-3">
                      <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-0.5 text-[10px] font-bold text-[var(--accent)]">
                        {p.paymentMode}
                      </span>
                    </td>
                    <td className="py-3 text-[var(--text-muted)]">
                      {p.note || "—"}
                    </td>
                    <td className="py-3 text-right font-semibold text-emerald-700">
                      ₹{Number(p.amount).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
