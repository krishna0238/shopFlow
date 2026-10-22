"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type IntelligenceData = {
  summary: {
    totalProducts: number;
    lowStockCount: number;
    outOfStockCount: number;
    totalStockValue: number;
    totalOutstandingCredit: number;
    customersWithCreditCount: number;
  };
  lowStockItems: {
    id: string;
    name: string;
    sku: string | null;
    stockQuantity: string | number;
    lowStockThreshold: string | number;
    purchasePrice: string | number;
    sellingPrice: string | number;
  }[];
  customersWithBalance: {
    id: string;
    name: string;
    phone: string | null;
    balance: number;
  }[];
  recentActivity: {
    id: string;
    action: string;
    entityType: string;
    entityId: string | null;
    createdAt: string;
    user: { name: string } | null;
  }[];
  priceChanges?: {
    productName: string;
    oldPrice: number;
    newPrice: number;
    changePct: number;
    direction: string;
  }[];
};

export default function IntelligencePage() {
  const router = useRouter();
  const [data, setData] = useState<IntelligenceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        setLoading(true);
        const res = await fetch("/api/intelligence");
        if (res.status === 401) {
          router.replace("/login");
          return;
        }
        if (!res.ok) throw new Error("Failed to load business intelligence");
        const json = await res.json();
        if (!cancelled) {
          setData(json);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Error loading data");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadData();
    return () => {
      cancelled = true;
    };
  }, [router]);

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
        <p className="font-semibold">Unable to load business intelligence</p>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">{error}</p>
      </div>
    );
  }

  const { summary, lowStockItems, customersWithBalance, recentActivity } = data;

  // Natural language query matching
  const q = query.toLowerCase().trim();
  const showLowStock =
    activeFilter === "low_stock" ||
    q.includes("low stock") ||
    q.includes("out of stock") ||
    q.includes("restock") ||
    q.includes("product");

  const showCredit =
    activeFilter === "credit" ||
    q.includes("credit") ||
    q.includes("owe") ||
    q.includes("khata") ||
    q.includes("customer");

  const showValuation =
    activeFilter === "valuation" ||
    q.includes("value") ||
    q.includes("valuation") ||
    q.includes("worth") ||
    q.includes("capital");

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="text-[10px] font-bold text-[var(--accent)]">
          Decision Support & Analytics
        </p>
        <h1 className="mt-2 text-[40px] leading-[1.1] tracking-[-0.03em] text-[var(--text-primary)]">
          Business Intelligence
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Real-time visibility into inventory health, working capital, and customer credit.
        </p>
      </div>

      {/* Smart Query Bar */}
      <section className="shopflow-glass rounded-3xl p-6">
        <div className="flex items-center gap-2">
          <span className="text-xl">🔍</span>
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            Smart Natural-Language Search
          </h2>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveFilter(null);
            }}
            placeholder="Ask about your business... (e.g. 'Which items are low in stock?')"
            className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--accent)]"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="rounded-full border border-[var(--border)] px-4 py-2 text-xs font-medium text-[var(--text-secondary)] hover:bg-black/5"
            >
              Clear
            </button>
          )}
        </div>

        {/* Suggested Quick Prompts */}
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-[var(--text-muted)]">Quick Questions:</span>
          <button
            type="button"
            onClick={() => {
              setQuery("Which products are low in stock?");
              setActiveFilter("low_stock");
            }}
            className="rounded-full bg-[var(--accent-soft)] px-3 py-1.5 font-medium text-[var(--accent)] transition hover:opacity-80"
          >
            ⚠️ Low stock items ({summary.lowStockCount})
          </button>
          <button
            type="button"
            onClick={() => {
              setQuery("Which customers have outstanding credit?");
              setActiveFilter("credit");
            }}
            className="rounded-full bg-amber-500/10 px-3 py-1.5 font-medium text-amber-800 transition hover:opacity-80"
          >
            📋 Outstanding Khata (₹{summary.totalOutstandingCredit.toLocaleString("en-IN")})
          </button>
          <button
            type="button"
            onClick={() => {
              setQuery("What is total inventory stock value?");
              setActiveFilter("valuation");
            }}
            className="rounded-full bg-blue-500/10 px-3 py-1.5 font-medium text-blue-800 transition hover:opacity-80"
          >
            💰 Inventory valuation (₹{summary.totalStockValue.toLocaleString("en-IN")})
          </button>
        </div>
      </section>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className={`shopflow-glass rounded-3xl p-5 ${showValuation ? "ring-2 ring-blue-600" : ""}`}>
          <span className="text-xs font-medium text-[var(--text-secondary)]">
            Total Inventory Valuation
          </span>
          <p className="mt-2 text-2xl font-bold text-[var(--text-primary)]">
            ₹{summary.totalStockValue.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
          </p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Across {summary.totalProducts} active catalogue items
          </p>
        </div>

        <div className="shopflow-glass rounded-3xl p-5">
          <span className="text-xs font-medium text-[var(--text-secondary)]">
            Customer Credit (Udhaar)
          </span>
          <p className="mt-2 text-2xl font-bold text-amber-800">
            ₹{summary.totalOutstandingCredit.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
          </p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Due from {summary.customersWithCreditCount} customers
          </p>
        </div>

        <div className="shopflow-glass rounded-3xl p-5">
          <span className="text-xs font-medium text-[var(--text-secondary)]">
            Restock Attention Needed
          </span>
          <p className="mt-2 text-2xl font-bold text-red-700">
            {summary.lowStockCount} items
          </p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            {summary.outOfStockCount} currently zero stock
          </p>
        </div>
      </div>

      {/* Search Result or Diagnostic Panels */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Inventory Alert Feed */}
        <section className={`shopflow-glass rounded-3xl p-6 ${showLowStock ? "ring-2 ring-[var(--accent)]" : ""}`}>
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
            <div>
              <h2 className="text-base font-semibold text-[var(--text-primary)]">
                Items Requiring Restock
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Products at or below their low-stock threshold
              </p>
            </div>
            <Link
              href="/inventory"
              className="text-xs font-semibold text-[var(--accent)] hover:underline"
            >
              Inventory →
            </Link>
          </div>

          {lowStockItems.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--text-secondary)]">
              ✓ All products are comfortably stocked.
            </p>
          ) : (
            <div className="mt-4 divide-y divide-[var(--border)]">
              {lowStockItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-3 text-sm first:pt-0 last:pb-0"
                >
                  <div>
                    <Link
                      href={`/inventory/${item.id}`}
                      className="font-semibold text-[var(--text-primary)] hover:underline"
                    >
                      {item.name}
                    </Link>
                    <p className="text-xs text-[var(--text-muted)]">
                      SKU: {item.sku || "—"} · Cost: ₹{Number(item.purchasePrice).toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-bold text-red-700">
                      {Number(item.stockQuantity)} in stock
                    </span>
                    <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                      Min: {Number(item.lowStockThreshold)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Khata Credit Due Feed */}
        <section className={`shopflow-glass rounded-3xl p-6 ${showCredit ? "ring-2 ring-[var(--accent)]" : ""}`}>
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
            <div>
              <h2 className="text-base font-semibold text-[var(--text-primary)]">
                Top Credit Receivables
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Customers with pending ledger balances
              </p>
            </div>
            <Link
              href="/customers"
              className="text-xs font-semibold text-[var(--accent)] hover:underline"
            >
              All Customers →
            </Link>
          </div>

          {customersWithBalance.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--text-secondary)]">
              ✓ No outstanding customer credit pending.
            </p>
          ) : (
            <div className="mt-4 divide-y divide-[var(--border)]">
              {customersWithBalance.slice(0, 6).map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between py-3 text-sm first:pt-0 last:pb-0"
                >
                  <div>
                    <Link
                      href={`/customers/${c.id}`}
                      className="font-semibold text-[var(--text-primary)] hover:underline"
                    >
                      {c.name}
                    </Link>
                    <p className="text-xs text-[var(--text-muted)]">
                      📞 {c.phone || "No phone"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-amber-800">
                      ₹{c.balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </p>
                    <Link
                      href={`/customers/${c.id}`}
                      className="text-[10px] font-semibold text-[var(--accent)] hover:underline"
                    >
                      Record Payment →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Price Change & Cost Margin Intelligence */}
      <section className="shopflow-glass rounded-3xl p-6">
        <div className="flex items-center gap-3 border-b border-[var(--border)] pb-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-lg">
            📈
          </span>
          <div>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              Supplier Price Change & Margin Intelligence
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Fluctuations detected across procurement invoices affecting retail profit margins
            </p>
          </div>
        </div>

        {data.priceChanges && data.priceChanges.length > 0 ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {data.priceChanges.map((pc, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-white/40 p-4"
              >
                <div>
                  <p className="font-semibold text-[var(--text-primary)]">
                    {pc.productName}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    Cost: ₹{pc.oldPrice.toFixed(2)} → ₹{pc.newPrice.toFixed(2)}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    pc.direction === "up"
                      ? "bg-red-500/10 text-red-700"
                      : "bg-emerald-500/10 text-emerald-700"
                  }`}
                >
                  {pc.direction === "up" ? "▲ +" : "▼ "}
                  {Math.abs(pc.changePct)}%
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-xs text-[var(--text-secondary)]">
            ✓ Purchase unit costs have remained stable across all recent vendor invoices.
          </p>
        )}
      </section>

      {/* Business Audit Timeline */}
      <section className="shopflow-glass rounded-3xl p-6">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">
          Recent Business Audit Timeline
        </h2>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Recorded transactions, stock changes, and system operations
        </p>

        {recentActivity.length === 0 ? (
          <p className="mt-4 text-sm text-[var(--text-secondary)]">
            No audit records found yet.
          </p>
        ) : (
          <div className="mt-4 divide-y divide-[var(--border)]">
            {recentActivity.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between py-3 text-xs first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-3">
                  <span className="rounded-lg bg-[var(--accent-soft)] px-2 py-1 font-mono font-bold text-[var(--accent)]">
                    {log.action}
                  </span>
                  <div>
                    <p className="font-semibold text-[var(--text-primary)]">
                      {log.entityType} ({log.entityId ? log.entityId.slice(0, 8) : "—"})
                    </p>
                    <p className="text-[10px] text-[var(--text-muted)]">
                      By {log.user?.name ?? "System"}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] text-[var(--text-muted)]">
                  {new Date(log.createdAt).toLocaleString("en-IN", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}