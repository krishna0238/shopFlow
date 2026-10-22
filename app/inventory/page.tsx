"use client";

import Link from "next/link";
import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";

type Category = {
  id: string;
  businessId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

type Product = {
  id: string;
  name: string;
  sku: string | null;
  hsnCode?: string | null;
  gstRate?: string | number | null;
  purchasePrice: string | number;
  sellingPrice: string | number;
  stockQuantity: string | number;
  lowStockThreshold: string | number;
  category: Category | null;
};

export default function InventoryPage() {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const [error, setError] = useState("");
  const [categoryError, setCategoryError] = useState("");

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "IN_STOCK" | "LOW_STOCK">("ALL");
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Create form states
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [hsnCode, setHsnCode] = useState("");
  const [gstRate, setGstRate] = useState("0");
  const [categoryId, setCategoryId] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");
  const [lowStockThreshold, setLowStockThreshold] = useState("");

  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/products");
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          router.replace("/login");
          return;
        }

        throw new Error(data.error || "Failed to load products");
      }

      setProducts(data.products);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load products"
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  const loadCategories = useCallback(async () => {
    try {
      setCategoriesLoading(true);
      setCategoryError("");

      const response = await fetch("/api/categories");
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          router.replace("/login");
          return;
        }

        throw new Error(data.error || "Failed to load categories");
      }

      setCategories(
        Array.isArray(data) ? data : data.categories ?? []
      );
    } catch (err) {
      setCategoryError(
        err instanceof Error ? err.message : "Failed to load categories"
      );
    } finally {
      setCategoriesLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadProducts();
      void loadCategories();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadProducts, loadCategories]);

  async function handleCreateProduct(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    try {
      setCreating(true);
      setCreateError("");

      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          sku: sku.trim() || undefined,
          hsnCode: hsnCode.trim() || undefined,
          gstRate: Number(gstRate || 0),
          categoryId: categoryId || undefined,
          purchasePrice: Number(purchasePrice),
          sellingPrice: Number(sellingPrice),
          stockQuantity: Number(stockQuantity || 0),
          lowStockThreshold: Number(lowStockThreshold || 0),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          router.replace("/login");
          return;
        }

        throw new Error(data.error || "Failed to create product");
      }

      setName("");
      setSku("");
      setHsnCode("");
      setGstRate("0");
      setCategoryId("");
      setPurchasePrice("");
      setSellingPrice("");
      setStockQuantity("");
      setLowStockThreshold("");
      setShowCreateForm(false);

      await loadProducts();
    } catch (err) {
      setCreateError(
        err instanceof Error ? err.message : "Failed to create product"
      );
    } finally {
      setCreating(false);
    }
  }

  // Statistics
  const totalStockUnits = useMemo(() => {
    return products.reduce((sum, p) => sum + Number(p.stockQuantity), 0);
  }, [products]);

  const totalStockValuation = useMemo(() => {
    return products.reduce(
      (sum, p) => sum + Number(p.stockQuantity) * Number(p.purchasePrice),
      0
    );
  }, [products]);

  const lowStockCount = useMemo(() => {
    return products.filter(
      (p) => Number(p.stockQuantity) <= Number(p.lowStockThreshold)
    ).length;
  }, [products]);

  const inStockCount = useMemo(() => {
    return products.filter(
      (p) => Number(p.stockQuantity) > Number(p.lowStockThreshold)
    ).length;
  }, [products]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.category && p.category.name.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      const isLow = Number(p.stockQuantity) <= Number(p.lowStockThreshold);

      if (statusFilter === "IN_STOCK") return !isLow;
      if (statusFilter === "LOW_STOCK") return isLow;
      return true;
    });
  }, [products, searchQuery, statusFilter]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-100" />
        <div className="grid gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="shopflow-glass h-24 animate-pulse rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-[10px] font-bold text-[var(--accent)]">
            Stock & Catalogue
          </p>
          <h1 className="mt-2 text-[40px] leading-[1.1] tracking-[-0.03em] text-[var(--text-primary)]">
            Products & Inventory
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Real-time stock quantities, cost valuation, and SKU management.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/categories"
            className="rounded-full border border-[var(--border)] px-4 py-2.5 text-xs font-medium text-[var(--text-secondary)] transition hover:bg-black/5"
          >
            Categories
          </Link>
          <a
            href="/api/products/export"
            download
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-white/60 px-4 py-2.5 text-xs font-medium text-[var(--text-primary)] transition hover:bg-white/80"
          >
            <span>📥</span>
            Export CSV
          </a>
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-[var(--border)] bg-white/60 px-4 py-2.5 text-xs font-semibold text-[var(--text-primary)] transition hover:bg-white/80">
            <span>📤</span>
            Import CSV
            <input
              type="file"
              accept=".csv"
              className="sr-only rounded-xl"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const fd = new FormData();
                fd.append("file", file);
                try {
                  const res = await fetch("/api/products/import", {
                    method: "POST",
                    body: fd,
                  });
                  const data = (await res.json()) as {
                    results?: {
                      created: number;
                      skipped: number;
                      errors: string[];
                    };
                    error?: string;
                  };
                  if (res.ok && data.results) {
                    alert(
                      `Import complete: ${data.results.created} created, ${
                        data.results.skipped
                      } skipped.${
                        data.results.errors.length > 0
                          ? "\nErrors: " +
                            data.results.errors.slice(0, 3).join("; ")
                          : ""
                      }`
                    );
                    void loadProducts();
                  } else {
                    alert(`Import failed: ${data.error ?? "Unknown error"}`);
                  }
                } catch {
                  alert("Import failed: network error");
                }
                e.target.value = "";
              }}
            />
          </label>
          <button
            type="button"
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-4 py-2.5 text-xs font-medium text-white transition hover:bg-[var(--accent-hover)]"
          >
            <span>{showCreateForm ? "✕" : "+"}</span>
            {showCreateForm ? "Close Form" : "New Product"}
          </button>
        </div>
      </div>

      {/* KPI Overview (Matching Screenshot 2026-10-15 204042) */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="shopflow-glass rounded-3xl p-4">
          <span className="text-xs text-[var(--text-secondary)]">Total Products</span>
          <p className="mt-1 text-2xl font-bold text-[var(--text-primary)]">
            {products.length}
          </p>
          <p className="mt-1 text-[11px] text-[var(--text-muted)]">Active catalogue lines</p>
        </div>

        <div className="shopflow-glass rounded-3xl p-4">
          <span className="text-xs text-[var(--text-secondary)]">Total Units in Stock</span>
          <p className="mt-1 text-2xl font-bold text-[var(--text-primary)]">
            {totalStockUnits.toLocaleString("en-IN")}
          </p>
          <p className="mt-1 text-[11px] text-[var(--text-muted)]">Quantity in hand</p>
        </div>

        <div className="shopflow-glass rounded-3xl p-4">
          <span className="text-xs text-[var(--text-secondary)]">Total Stock Value</span>
          <p className="mt-1 text-2xl font-bold text-emerald-800">
            ₹{totalStockValuation.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
          </p>
          <p className="mt-1 text-[11px] text-[var(--text-muted)]">Valued at purchase cost</p>
        </div>

        <div className="shopflow-glass rounded-3xl p-4">
          <span className="text-xs text-[var(--text-secondary)]">Low Stock Alerts</span>
          <p className={`mt-1 text-2xl font-bold ${lowStockCount > 0 ? "text-amber-800" : "text-emerald-800"}`}>
            {lowStockCount}
          </p>
          <p className="mt-1 text-[11px] text-[var(--text-muted)]">Items at or below threshold</p>
        </div>
      </div>

      {/* Collapsible Create Product Card */}
      {showCreateForm && (
        <section className="shopflow-glass rounded-3xl p-6">
          <h2 className="mb-4 text-base font-semibold text-[var(--text-primary)]">
            Add New Product
          </h2>

          <form onSubmit={handleCreateProduct} className="grid gap-4 md:grid-cols-3">
            <div>
              <label
                htmlFor="productName"
                className="mb-1 block text-xs font-medium text-[var(--text-primary)]"
              >
                Product Name *
              </label>
              <input
                id="productName"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                placeholder="e.g. 20W Fast Charger"
              />
            </div>

            <div>
              <label
                htmlFor="productSku"
                className="mb-1 block text-xs font-medium text-[var(--text-primary)]"
              >
                SKU / Barcode
              </label>
              <input
                id="productSku"
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                placeholder="e.g. CHG-20W"
              />
            </div>

            <div>
              <label
                htmlFor="productCategory"
                className="mb-1 block text-xs font-medium text-[var(--text-primary)]"
              >
                Category
              </label>
              <select
                id="productCategory"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                disabled={categoriesLoading || creating}
                className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
              >
                <option value="">No category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {categoryError && (
                <p className="mt-1 text-[11px] text-red-600">{categoryError}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="hsnCode"
                className="mb-1 block text-xs font-medium text-[var(--text-primary)]"
              >
                HSN Code
              </label>
              <input
                id="hsnCode"
                type="text"
                value={hsnCode}
                onChange={(e) => setHsnCode(e.target.value)}
                className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                placeholder="e.g. 8517"
              />
            </div>

            <div>
              <label
                htmlFor="gstRate"
                className="mb-1 block text-xs font-medium text-[var(--text-primary)]"
              >
                GST Rate (%)
              </label>
              <select
                id="gstRate"
                value={gstRate}
                onChange={(e) => setGstRate(e.target.value)}
                className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
              >
                <option value="0">0% (Exempt / Nil)</option>
                <option value="5">5%</option>
                <option value="12">12%</option>
                <option value="18">18%</option>
                <option value="28">28%</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="purchasePrice"
                className="mb-1 block text-xs font-medium text-[var(--text-primary)]"
              >
                Cost / Purchase Price (₹) *
              </label>
              <input
                id="purchasePrice"
                type="number"
                step="0.01"
                min="0"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                required
                className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                placeholder="0.00"
              />
            </div>

            <div>
              <label
                htmlFor="sellingPrice"
                className="mb-1 block text-xs font-medium text-[var(--text-primary)]"
              >
                Selling Price (₹) *
              </label>
              <input
                id="sellingPrice"
                type="number"
                step="0.01"
                min="0"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                required
                className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                placeholder="0.00"
              />
            </div>

            <div>
              <label
                htmlFor="stockQuantity"
                className="mb-1 block text-xs font-medium text-[var(--text-primary)]"
              >
                Initial Stock
              </label>
              <input
                id="stockQuantity"
                type="number"
                min="0"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                placeholder="0"
              />
            </div>

            <div>
              <label
                htmlFor="lowStockThreshold"
                className="mb-1 block text-xs font-medium text-[var(--text-primary)]"
              >
                Low-Stock Alert Level
              </label>
              <input
                id="lowStockThreshold"
                type="number"
                min="0"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(e.target.value)}
                className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                placeholder="5"
              />
            </div>

            <div className="flex items-end md:col-span-2">
              <button
                type="submit"
                disabled={creating}
                className="rounded-full bg-[var(--accent)] px-6 py-2.5 text-xs font-medium text-white transition hover:bg-[var(--accent-hover)] disabled:opacity-50"
              >
                {creating ? "Saving Product..." : "Save Product to Catalogue"}
              </button>
            </div>
          </form>

          {createError && (
            <p className="mt-4 text-xs font-semibold text-red-600">{createError}</p>
          )}
        </section>
      )}

      {/* Product List Table (Inspired by Screenshot 2026-10-15 204042) */}
      <section className="shopflow-glass rounded-3xl p-6">
        {/* Controls Bar: Search & Filter Tabs */}
        <div className="flex flex-col justify-between gap-4 border-b border-[var(--border)] pb-5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              type="button"
              onClick={() => setStatusFilter("ALL")}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                statusFilter === "ALL"
                  ? "bg-[var(--accent)] text-white"
                  : "text-[var(--text-secondary)] hover:bg-black/5"
              }`}
            >
              All ({products.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("IN_STOCK")}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                statusFilter === "IN_STOCK"
                  ? "bg-[var(--accent)] text-white"
                  : "text-[var(--text-secondary)] hover:bg-black/5"
              }`}
            >
              In Stock ({inStockCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("LOW_STOCK")}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                statusFilter === "LOW_STOCK"
                  ? "bg-amber-800 text-white"
                  : "text-[var(--text-secondary)] hover:bg-black/5"
              }`}
            >
              Low Stock ({lowStockCount})
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products or SKU..."
              className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
            />
          </div>
        </div>

        {error && <p className="mt-4 text-xs font-semibold text-red-600">{error}</p>}

        {filteredProducts.length === 0 ? (
          <div className="py-12 text-center text-sm text-[var(--text-secondary)]">
            <p>No products match your search or filter.</p>
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  <th className="py-3 px-3">Product Name & SKU</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3 text-right">Cost Price</th>
                  <th className="py-3 px-3 text-right">Selling Price</th>
                  <th className="py-3 px-3 text-right">In Hand</th>
                  <th className="py-3 px-3 text-right">Stock Value</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filteredProducts.map((p) => {
                  const stockNum = Number(p.stockQuantity);
                  const thresholdNum = Number(p.lowStockThreshold);
                  const costNum = Number(p.purchasePrice);
                  const sellNum = Number(p.sellingPrice);
                  const valuation = stockNum * costNum;
                  const isLow = stockNum <= thresholdNum;
                  const isOut = stockNum === 0;

                  return (
                    <tr
                      key={p.id}
                      className="text-[var(--text-primary)] transition hover:bg-black/[0.02]"
                    >
                      <td className="py-3 px-3">
                        <Link
                          href={`/inventory/${p.id}`}
                          className="font-semibold hover:text-[var(--accent)]"
                        >
                          {p.name}
                        </Link>
                        <p className="font-mono text-[11px] text-[var(--text-muted)]">
                          {p.sku || "No SKU"}
                          {p.hsnCode && ` • HSN: ${p.hsnCode}`}
                          {Number(p.gstRate || 0) > 0 && ` • GST: ${p.gstRate}%`}
                        </p>
                      </td>

                      <td className="py-3 px-3 text-xs text-[var(--text-secondary)]">
                        {p.category?.name || "—"}
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-xs">
                        ₹{costNum.toFixed(2)}
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-xs font-semibold">
                        ₹{sellNum.toFixed(2)}
                      </td>

                      <td className="py-3 px-3 text-right font-semibold">
                        {stockNum}
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-xs text-emerald-800 font-semibold">
                        ₹{valuation.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            isOut
                              ? "bg-red-500/10 text-red-700"
                              : isLow
                              ? "bg-amber-500/10 text-amber-800"
                              : "bg-emerald-500/10 text-emerald-800"
                          }`}
                        >
                          {isOut ? "Out of Stock" : isLow ? "Low Stock" : "In Stock"}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <Link
                          href={`/inventory/${p.id}`}
                          className="rounded-lg bg-[var(--accent-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--accent)] transition hover:opacity-80"
                        >
                          Manage
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
