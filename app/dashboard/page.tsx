
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          setError(null);
        }
      } catch (err) {
        console.error("Dashboard loading failed:", err);

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
      <main className="py-2">
        <div className="mx-auto max-w-[1600px] space-y-6">
          <div className="h-16 animate-pulse rounded-2xl bg-slate-100" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-36 animate-pulse rounded-3xl bg-slate-100"
              />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (error || !summary) {
    return (
      <main className="py-2">
        <section className="mx-auto max-w-2xl rounded-3xl bg-white p-8 border border-[var(--border)]">
          <h1 className="text-[44px] leading-[1.1] tracking-[-0.03em]">
            Dashboard unavailable
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {error ?? "No dashboard data available."}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-5 rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-medium text-white hover:bg-[var(--accent-hover)]"
          >
            Try again
          </button>
        </section>
      </main>
    );
  }

  const metrics = [
    {
      title: "Total Sales",
      value: formatCurrency(summary.salesTotal),
      note: `${summary.salesCount.toLocaleString("en-IN")} recorded sales`,
      icon: "₹",
      color: "blue",
    },
    {
      title: "Products",
      value: summary.productCount.toLocaleString("en-IN"),
      note: "Products in catalogue",
      icon: "▤",
      color: "blue",
    },
    {
      title: "Customers",
      value: summary.customerCount.toLocaleString("en-IN"),
      note: "Registered customers",
      icon: "♙",
      color: "blue",
    },
    {
      title: "Outstanding Credit",
      value: formatCurrency(summary.outstandingCredit),
      note: "Credit to follow up",
      icon: "₹",
      color: "amber",
    },
  ];

  const salesForChart = [...summary.recentSales]
  .slice(-7)
  .reverse()
  .map((sale) => ({
    id: sale.id,
    amount: Math.max(0, Number(sale.totalAmount) || 0),
    date: new Date(sale.createdAt),
  }));

  const chartMax = Math.max(
    1,
    ...salesForChart.map((sale) => sale.amount),
  );

  const chartTotal = salesForChart.reduce(
    (total, sale) => total + sale.amount,
    0,
  );

  return (
    <div className="text-[var(--text-primary)]">
      <div className="mx-auto w-full max-w-none space-y-6">
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-[44px] leading-[1.1] tracking-[-0.03em]">
              Dashboard
            </h1>
            <p className="mt-2 text-[17px] text-[var(--text-secondary)]">
              Let&apos;s see how your shop is doing
            </p>
          </div>

          
        </header>

        {/* Main dashboard grid */}
        <section className="grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-12">
          {/* Metric cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-5">
            {metrics.map((metric) => (
              <article
                key={metric.title}
                className="min-w-0 rounded-3xl bg-white p-4 sm:p-5 border border-[var(--border)]"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-xl text-lg font-semibold ${
                        metric.color === "amber"
                          ? "bg-amber-50 text-amber-600"
                          : "bg-blue-50 text-blue-600"
                      }`}
                    >
                      {metric.icon}
                    </span>
                    <h2 className="text-base font-medium text-slate-800">
                      {metric.title}
                    </h2>
                  </div>
                  <span className="text-xl leading-none text-slate-400">
                    ···
                  </span>
                </div>

                <p className="mt-6 wrap-break-word text-2xl font-semibold tracking-tight text-slate-950">
                  {metric.value}
                </p>
                <p className="mt-2 text-xs text-slate-400">
                  {metric.note}
                </p>
              </article>
            ))}
          </div>

          {/* Recent sales */}
          <section className="min-w-0 rounded-3xl bg-white p-5 sm:p-6 lg:col-span-4 border border-[var(--border)]">
            <PanelTitle
              title="Recent Sales"
              subtitle="Latest transactions"
              href="/sales"
              linkText="View all"
            />

            <div className="mt-6 grid grid-cols-[minmax(0,1fr)_auto] gap-3 border-b border-slate-100 pb-3 text-sm text-slate-400">
              <span>Customer</span>
              <span className="text-right">Amount</span>
            </div>

            {summary.recentSales.length === 0 ? (
              <EmptyState
                title="No sales yet"
                description="Your recent transactions will appear here."
                href="/sales"
                linkText="Record a sale"
              />
            ) : (
              <div className="divide-y divide-slate-100">
                {summary.recentSales.slice(0, 5).map((sale) => (
                  <div
                    key={sale.id}
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3.5"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
                        {(sale.customer?.name ?? "W")
                          .trim()
                          .charAt(0)
                          .toUpperCase()}
                      </span>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-800">
                          {sale.customer?.name ?? "Walk-in customer"}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {formatSaleDate(sale.createdAt)} · {sale.paymentMode}
                        </p>
                      </div>
                    </div>

                    <p className="whitespace-nowrap text-sm font-medium text-slate-900">
                      {formatCurrency(sale.totalAmount)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Inventory status */}
          <section className="min-w-0 rounded-3xl bg-white p-5 sm:p-6 lg:col-span-3 border border-[var(--border)]">
            <PanelTitle
              title="Inventory Status"
              subtitle="Stock needing attention"
              href="/inventory"
              linkText="View stock"
            />

            <div className="mt-5 space-y-5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-slate-500">
                  Total products
                </span>
                <span className="text-sm font-semibold">
                  {summary.productCount.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="h-px bg-slate-100" />

              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-slate-500">
                  Low-stock items
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    summary.lowStockCount > 0
                      ? "bg-amber-50 text-amber-700"
                      : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {summary.lowStockCount}
                </span>
              </div>

              <div className="h-px bg-slate-100" />

              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-slate-500">Suppliers</span>
                <span className="text-sm font-semibold">
                  {summary.supplierCount.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="h-px bg-slate-100" />

              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-slate-500">
                  Purchase invoices
                </span>
                <span className="text-sm font-semibold">
                  {summary.purchaseInvoiceCount.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            <Link
              href="/inventory"
              className="mt-7 flex w-full items-center justify-center rounded-full bg-blue-50 px-4 py-3 text-sm font-medium text-blue-600 transition hover:bg-blue-100"
            >
              Manage inventory →
            </Link>
          </section>
        </section>

        {/* Lower panels */}
        <section className="grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-12">
          {/* Low stock products */}
          <section className="min-w-0 rounded-3xl bg-white p-5 sm:p-6 lg:col-span-5 border border-[var(--border)]">
            <PanelTitle
              title="Stock Alerts"
              subtitle="Products that may need restocking"
              href="/inventory"
              linkText="View inventory"
            />

            {summary.lowStockProducts.length === 0 ? (
              <div className="mt-6 rounded-2xl bg-emerald-50/70 p-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-lg text-emerald-600">
                  ✓
                </span>
                <p className="mt-3 text-sm font-semibold text-slate-800">
                  Stock looks good
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  There are no low-stock products to review right now.
                </p>
              </div>
            ) : (
              <div className="mt-5 divide-y divide-slate-100">
                {summary.lowStockProducts.slice(0, 6).map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between gap-3 py-4 first:pt-0"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-lg text-blue-600">
                        ▤
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800">
                          {product.name}
                        </p>
                        <p className="mt-1 truncate text-xs text-slate-400">
                          {product.sku ? `SKU ${product.sku}` : "No SKU"}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold text-amber-600">
                        {product.stockQuantity}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Threshold: {product.lowStockThreshold}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Sales activity chart */}
          <section className="min-w-0 rounded-3xl bg-white p-5 sm:p-6 lg:col-span-7 border border-[var(--border)]">
            <PanelTitle
              title="Sales Activity"
              subtitle="Your latest recorded transactions"
              href="/sales"
              linkText="View sales"
            />

            <div className="mt-6 flex flex-wrap items-start justify-between gap-5">
              <div>
                <p className="text-2xl font-semibold tracking-tight text-slate-900">
                  {formatCurrency(chartTotal)}
                </p>
                <p className="mt-2 text-xs text-slate-400">
                  Total of the transactions shown below
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[var(--peach)]" />
                  Sales
                </span>
              </div>
            </div>

            {salesForChart.length === 0 ? (
              <div className="mt-8 flex min-h-48 flex-col items-center justify-center rounded-2xl bg-slate-50 text-center">
                <p className="text-sm font-medium text-slate-700">
                  Your sales chart will appear here
                </p>
                <p className="mt-2 text-xs text-slate-400">
                  Record sales to start building your activity view.
                </p>
                <Link
                  href="/sales"
                  className="mt-4 text-sm font-semibold text-blue-600 hover:underline"
                >
                  Record a sale →
                </Link>
              </div>
            ) : (
              <>
                <div className="mt-7 flex h-56 items-end gap-2 border-b border-slate-100 px-1 pt-3 sm:gap-4">
                  {salesForChart.map((sale) => {
                    const height = Math.max(
                      8,
                      (sale.amount / chartMax) * 100,
                    );

                    return (
                      <div
                        key={sale.id}
                        className="group flex h-full min-w-0 flex-1 flex-col justify-end"
                        title={`${formatSaleDate(sale.date.toISOString())}: ${formatCurrency(sale.amount)}`}
                      >
                        <div className="mb-2 hidden text-center text-[10px] text-slate-500 group-hover:block">
                          {formatCurrency(sale.amount)}
                        </div>
                        <div
                          className="w-full rounded-t-lg bg-[var(--peach)] transition-colors group-hover:bg-[var(--sienna)]"
                          style={{ height: `${height}%` }}
                        />
                      </div>
                    );
                  })}
                </div>

                <div className="mt-3 flex gap-2 sm:gap-4">
                  {salesForChart.map((sale) => (
                    <div
                      key={sale.id}
                      className="min-w-0 flex-1 text-center text-[10px] text-slate-400"
                    >
                      <span className="block truncate">
                        {sale.date.toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </div>
                  ))}
                </div>

                <p className="mt-5 text-xs leading-5 text-slate-400">
                  Each bar represents one of your latest recorded sales. This
                  chart uses actual transaction amounts, not estimated targets.
                </p>
              </>
            )}
          </section>
        </section>

        {/* Quick links */}
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <QuickLink
            href="/sales"
            icon="₹"
            title="Sales"
            description="Record a transaction"
          />
          <QuickLink
            href="/inventory"
            icon="▤"
            title="Inventory"
            description="Manage products"
          />
          <QuickLink
            href="/customers"
            icon="♙"
            title="Customers"
            description="Customer records"
          />
          <QuickLink
            href="/purchases"
            icon="↗"
            title="Purchases"
            description="Manage invoices"
          />
        </section>

        <footer className="py-3 text-center text-xs text-slate-400">
          ShopFlow · Your shop, all in one place
        </footer>
      </div>
    </div>
  );
}

function PanelTitle({
  title,
  subtitle,
  href,
  linkText,
}: {
  title: string;
  subtitle: string;
  href: string;
  linkText: string;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-[22px] leading-[1.2] tracking-[-0.02em]">
          {title}
        </h2>
        <p className="mt-1 text-sm leading-6 text-slate-400">
          {subtitle}
        </p>
      </div>
      <Link
        href={href}
        className="shrink-0 text-[14px] text-[var(--text-primary)] underline-offset-4 hover:underline"
      >
        {linkText} →
      </Link>
    </div>
  );
}

function EmptyState({
  title,
  description,
  href,
  linkText,
}: {
  title: string;
  description: string;
  href: string;
  linkText: string;
}) {
  return (
    <div className="py-8">
      <p className="text-sm font-medium text-slate-700">{title}</p>
      <p className="mt-1 text-xs leading-5 text-slate-400">{description}</p>
      <Link
        href={href}
        className="mt-4 inline-block text-xs font-semibold text-blue-600 hover:underline"
      >
        {linkText} →
      </Link>
    </div>
  );
}

function QuickLink({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="flex min-w-0 items-center gap-3 rounded-3xl bg-white p-4 transition hover:border-[var(--border-strong)] border border-[var(--border)]"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-lg font-semibold text-blue-600">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-slate-800">
          {title}
        </span>
        <span className="mt-1 block truncate text-xs text-slate-400">
          {description}
        </span>
      </span>
    </Link>
  );
}


function formatCurrency(value: string | number) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return `₹${value}`;
  }

  return `₹${amount.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
}

function formatSaleDate(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}
