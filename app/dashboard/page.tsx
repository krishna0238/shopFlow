
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type DashboardSummary = {
  productCount: number;
  customerCount: number;
  supplierCount: number;
  salesCount: number;
  purchaseInvoiceCount: number;
  salesTotal: string;
  outstandingCredit: number;
  lowStockCount: number;
  lowStockProducts: {
    id: string;
    name: string;
    sku: string | null;
    stockQuantity: string;
    lowStockThreshold: string;
  }[];
  recentSales: {
    id: string;
    totalAmount: string;
    paymentMode: "CASH" | "UPI" | "CREDIT";
    createdAt: string;
    customer: {
      id: string;
      name: string;
    } | null;
  }[];
};

export default function DashboardPage() {
  const router = useRouter();

  const [summary, setSummary] =
    useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        const response = await fetch("/api/dashboard");

        if (response.status === 401) {
          router.replace("/login");
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to load dashboard");
        }

        const data = await response.json();

        if (!cancelled) {
          setSummary(data.summary);
        }
      } catch (error) {
        console.error("Dashboard loading failed:", error);

        if (!cancelled) {
          setError("Unable to load dashboard data.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen w-full px-4 py-8 sm:px-6 lg:px-8 xl:px-10 2xl:px-14">
        <div className="w-full">
          <div className="mb-8">
            <div className="h-3 w-32 animate-pulse rounded-full bg-black/[0.06]" />
            <div className="mt-4 h-10 w-52 animate-pulse rounded-xl bg-black/[0.06]" />
            <div className="mt-3 h-5 w-80 max-w-full rounded-lg bg-black/[0.04]" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="h-32 animate-pulse rounded-3xl border border-black/[0.06] bg-white/[0.28]"
              />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (error || !summary) {
    return (
      <main className="min-h-screen w-full px-4 py-8 sm:px-6 lg:px-8 xl:px-10 2xl:px-14">
        <div className="w-full">
          <div className="shopflow-glass rounded-3xl border border-red-500/20 p-6">
            <p className="text-sm font-medium text-red-600">
              Dashboard error
            </p>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              {error ?? "No dashboard data available."}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 rounded-lg border border-black/10 px-4 py-2 text-sm font-medium"
            >
              Try again
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen w-full overflow-hidden px-4 py-8 sm:px-6 lg:px-8 xl:px-10 2xl:px-14">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white/45 blur-3xl dark:bg-white/[0.018]" />
        <div className="absolute right-0 top-24 h-64 w-64 rounded-full bg-white/35 blur-3xl dark:bg-white/[0.012]" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-white/25 blur-3xl dark:bg-white/[0.01]" />
      </div>

      <div className="relative w-full">
        <section className="mb-8">
          <p className="text-[11px] font-semibold tracking-[0.2em] text-[var(--text-muted)]">
            BUSINESS OVERVIEW
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-4xl">
            Dashboard
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)] sm:text-base">
            Understand what is happening in your business.
          </p>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard title="Products" value={summary.productCount} />
          <SummaryCard title="Customers" value={summary.customerCount} />
          <SummaryCard title="Suppliers" value={summary.supplierCount} />
          <SummaryCard title="Sales" value={summary.salesCount} />
          <SummaryCard title="Total sales" value={`₹${summary.salesTotal}`} strong />
          <SummaryCard
            title="Outstanding credit"
            value={`₹${summary.outstandingCredit}`}
            attention={summary.outstandingCredit > 0}
          />
          <SummaryCard
            title="Low stock"
            value={summary.lowStockCount}
            attention={summary.lowStockCount > 0}
          />
          <SummaryCard
            title="Purchase invoices"
            value={summary.purchaseInvoiceCount}
          />
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <GlassPanel>
            <PanelHeader
              eyebrow="ACTION REQUIRED"
              title="Needs attention"
              description="Items that may require action."
            />

            {summary.lowStockProducts.length === 0 ? (
              <div className="shopflow-glass-soft mt-6 rounded-2xl p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full border border-emerald-600/10 bg-emerald-600/5">
                    <span className="text-sm text-emerald-700">✓</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      Nothing requires attention
                    </p>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                      No low-stock products right now.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                {summary.lowStockProducts.map((product) => (
                  <div
                    key={product.id}
                    className="shopflow-glass-soft rounded-2xl p-4 hover:bg-white/[0.38]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                          {product.name}
                        </p>
                        {product.sku && (
                          <p className="mt-1 text-xs text-[var(--text-muted)]">
                            SKU {product.sku}
                          </p>
                        )}
                      </div>
                      <span className="rounded-full border border-amber-600/15 bg-amber-500/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-amber-700">
                        Low stock
                      </span>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-black/[0.06] pt-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
                          Current stock
                        </p>
                        <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">
                          {product.stockQuantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] uppercase tracking-[0.12em] text-[var(--text-muted)]">
                          Threshold
                        </p>
                        <p className="mt-1 text-sm font-medium text-[var(--text-secondary)]">
                          {product.lowStockThreshold}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassPanel>

          <GlassPanel>
            <PanelHeader
              eyebrow="RECENT ACTIVITY"
              title="Recent sales"
              description="The latest transactions recorded in your shop."
            />

            {summary.recentSales.length === 0 ? (
              <div className="shopflow-glass-soft mt-6 rounded-2xl p-5">
                <p className="text-sm text-[var(--text-muted)]">
                  No sales yet.
                </p>
              </div>
            ) : (
              <div className="mt-6 divide-y divide-black/[0.06]">
                {summary.recentSales.map((sale) => (
                  <div
                    key={sale.id}
                    className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                        {sale.customer?.name ?? "Walk-in customer"}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <PaymentModeBadge paymentMode={sale.paymentMode} />
                        <span className="text-xs text-[var(--text-muted)]">
                          {formatSaleDate(sale.createdAt)}
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-base font-semibold text-[var(--text-primary)]">
                        ₹{sale.totalAmount}
                      </p>
                      <p className="mt-1 text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
                        Sale
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassPanel>
        </section>
      </div>
    </main>
  );
}

type SummaryCardProps = {
  title: string;
  value: string | number;
  strong?: boolean;
  attention?: boolean;
};

function SummaryCard({
  title,
  value,
  strong = false,
  attention = false,
}: SummaryCardProps) {
  return (
    <div className="shopflow-glass group relative overflow-hidden rounded-3xl p-5 hover:-translate-y-0.5">
      <div className="absolute inset-x-0 top-0 h-px bg-white/70 dark:bg-white/[0.04]" />
      <p className="text-sm font-medium text-[var(--text-secondary)]">
        {title}
      </p>
      <p
        className={`mt-4 tracking-tight ${
          strong
            ? "text-3xl font-semibold text-[var(--text-primary)]"
            : attention
              ? "text-3xl font-semibold text-[var(--accent-strong)]"
              : "text-3xl font-semibold text-[var(--text-primary)]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

type GlassPanelProps = {
  children: React.ReactNode;
};

function GlassPanel({ children }: GlassPanelProps) {
  return (
    <div className="shopflow-glass-strong rounded-3xl p-5 sm:p-6">
      {children}
    </div>
  );
}

type PanelHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
};

function PanelHeader({
  eyebrow,
  title,
  description,
}: PanelHeaderProps) {
  return (
    <div>
      <p className="text-[10px] font-semibold tracking-[0.2em] text-[var(--text-muted)]">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-xl font-semibold tracking-tight text-[var(--text-primary)]">
        {title}
      </h2>
      <p className="mt-1 text-sm text-[var(--text-secondary)]">
        {description}
      </p>
    </div>
  );
}

type PaymentModeBadgeProps = {
  paymentMode: "CASH" | "UPI" | "CREDIT";
};

function PaymentModeBadge({ paymentMode }: PaymentModeBadgeProps) {
  const styles = {
    CASH:
      "border-black/[0.08] bg-black/[0.035] text-[var(--text-secondary)]",
    UPI: "border-sky-600/10 bg-sky-500/5 text-sky-700",
    CREDIT:
      "border-amber-600/15 bg-amber-500/10 text-amber-700",
  };

  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${styles[paymentMode]}`}
    >
      {paymentMode}
    </span>
  );
}

function formatSaleDate(dateString: string) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
}
