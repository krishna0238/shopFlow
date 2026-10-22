
"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type ProductCategory = {
  id: string;
  name: string;
};

type Product = {
  id: string;
  name: string;
  sku: string | null;
  purchasePrice: string | number;
  sellingPrice: string | number;
  stockQuantity: string | number;
  lowStockThreshold: string | number;
  isActive: boolean;
  category: ProductCategory | null;
};

type InventoryMovement = {
  id: string;
  type: string;
  quantity: string | number;
  note: string | null;
  referenceId: string | null;
  createdAt: string;
};

type PriceHistoryEntry = {
  id: string;
  type: "PURCHASE" | "SALE";
  price: number;
  quantity: number;
  date: string;
  status: string;
  referenceId: string;
  reference: string;
  paymentMode?: "CASH" | "UPI" | "CREDIT";
};

type PriceHistoryResponse = {
  product: {
    id: string;
    name: string;
  };
  currentPrices: {
    purchasePrice: number;
    sellingPrice: number;
  };
  history: PriceHistoryEntry[];
};

export default function ProductDetailsPage() {
  const params = useParams<{ productId: string }>();
  const router = useRouter();
  const productId = params.productId;

  const [product, setProduct] = useState<Product | null>(null);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [priceHistory, setPriceHistory] = useState<PriceHistoryEntry[]>([]);
  const [currentPrices, setCurrentPrices] = useState<{
    purchasePrice: number;
    sellingPrice: number;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [deactivating, setDeactivating] = useState(false);
  const [error, setError] = useState("");
  const [deactivateError, setDeactivateError] = useState("");

  const loadProductDetails = useCallback(
    async (id: string) => {
      try {
        setLoading(true);
        setError("");

        const [
          productsResponse,
          movementsResponse,
          priceHistoryResponse,
        ] = await Promise.all([
          fetch("/api/products"),
          fetch(`/api/inventory?productId=${encodeURIComponent(id)}`),
          fetch(
            `/api/products/price-history?productId=${encodeURIComponent(id)}`
          ),
        ]);

        const responses = [
          productsResponse,
          movementsResponse,
          priceHistoryResponse,
        ];

        if (responses.some((response) => response.status === 401)) {
          router.replace("/login");
          return;
        }

        if (!productsResponse.ok) {
          throw new Error("Failed to load products");
        }

        if (!movementsResponse.ok) {
          throw new Error("Failed to load inventory history");
        }

        if (!priceHistoryResponse.ok) {
          throw new Error("Failed to load price history");
        }

        const productsData = await productsResponse.json();
        const movementsData = await movementsResponse.json();
        const priceHistoryData: PriceHistoryResponse =
          await priceHistoryResponse.json();

        const products: Product[] = Array.isArray(productsData)
          ? productsData
          : productsData.products ?? [];

        const selectedProduct = products.find(
          (item) => item.id === id
        );

        if (!selectedProduct) {
          throw new Error("Product not found");
        }

        setProduct(selectedProduct);

        const movementList: InventoryMovement[] =
          Array.isArray(movementsData)
            ? movementsData
            : movementsData.movements ?? [];

        setMovements(movementList);
        setPriceHistory(priceHistoryData.history ?? []);
        setCurrentPrices(priceHistoryData.currentPrices);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load product details"
        );
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  useEffect(() => {
    let cancelled = false;

    const timeoutId = window.setTimeout(() => {
      if (!cancelled && productId) {
        void loadProductDetails(productId);
      }
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [productId, loadProductDetails]);

  async function handleDeactivateProduct() {
    if (!product) {
      return;
    }

    const confirmed = window.confirm(
      `Deactivate "${product.name}"? It will no longer appear in the active inventory list. Historical sales, purchases, and stock records will be preserved.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeactivating(true);
      setDeactivateError("");

      const response = await fetch("/api/products", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: product.id,
        }),
      });

      const data = await response.json();

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to deactivate product"
        );
      }

      router.push("/inventory");
    } catch (err) {
      setDeactivateError(
        err instanceof Error
          ? err.message
          : "Failed to deactivate product"
      );
    } finally {
      setDeactivating(false);
    }
  }

  if (loading) {
    return (
      <main>
        <p className="text-[var(--text-secondary)]">Loading product details...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main>
        <h1 className="text-[40px] leading-[1.1] tracking-[-0.03em]">Product details</h1>
        <p className="mt-4 text-red-600">{error}</p>
        <div className="mt-6">
          <Link href="/inventory" className="sf-link">
            ← Back to inventory
          </Link>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main>
        <h1 className="text-[40px] leading-[1.1] tracking-[-0.03em]">Product not found</h1>
        <div className="mt-6">
          <Link href="/inventory" className="sf-link">
            ← Back to inventory
          </Link>
        </div>
      </main>
    );
  }

  const stockQuantity = Number(product.stockQuantity);
  const lowStockThreshold = Number(product.lowStockThreshold);

  const stockStatus =
    stockQuantity <= lowStockThreshold
      ? "Low stock"
      : "In stock";

  const isLow = stockQuantity <= lowStockThreshold;

  const details: { label: string; value: React.ReactNode }[] = [
    { label: "Product", value: product.name },
    { label: "Category", value: product.category?.name || "—" },
    { label: "SKU", value: product.sku || "—" },
    {
      label: "Purchase price",
      value: `₹${Number(
        currentPrices?.purchasePrice ?? product.purchasePrice
      ).toFixed(2)}`,
    },
    {
      label: "Selling price",
      value: `₹${Number(
        currentPrices?.sellingPrice ?? product.sellingPrice
      ).toFixed(2)}`,
    },
    { label: "Current stock", value: stockQuantity },
    { label: "Low stock threshold", value: lowStockThreshold },
    {
      label: "Status",
      value: (
        <span
          className={`inline-flex rounded-full px-3 py-1 text-sm ${
            isLow
              ? "bg-amber-100 text-amber-800"
              : "bg-emerald-100 text-emerald-800"
          }`}
        >
          {stockStatus}
        </span>
      ),
    },
    { label: "Active", value: product.isActive ? "Yes" : "No" },
  ];

  return (
    <main className="mx-auto max-w-[1100px]">
      <Link
        href="/inventory"
        className="text-[14px] text-[var(--text-secondary)] underline-offset-4 hover:text-[var(--text-primary)] hover:underline"
      >
        ← Back to inventory
      </Link>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[40px] leading-[1.1] tracking-[-0.03em]">
            {product.name}
          </h1>
          <p className="mt-2 text-[17px] text-[var(--text-secondary)]">
            Product details and inventory history
          </p>
        </div>

        {product.isActive && (
          <button
            type="button"
            onClick={handleDeactivateProduct}
            disabled={deactivating}
            className="h-10 rounded-full border border-red-600 px-5 text-[14px] text-red-600 transition hover:bg-red-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {deactivating ? "Deactivating..." : "Deactivate product"}
          </button>
        )}
      </div>

      {deactivateError && (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {deactivateError}
        </p>
      )}

      <section className="mt-8 rounded-3xl border border-[var(--border)] bg-white p-6 sm:p-8">
        <h2 className="text-2xl">Product information</h2>

        <dl className="mt-6 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-x-6 gap-y-7">
          {details.map((item) => (
            <div key={item.label}>
              <dt className="text-[14px] text-[var(--text-muted)]">
                {item.label}
              </dt>
              <dd className="mt-1 text-[17px] font-medium">{item.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-6 rounded-3xl border border-[var(--border)] bg-white p-6 sm:p-8">
        <h2 className="text-2xl">Price history</h2>

        <p className="mt-2 text-[15px] text-[var(--text-secondary)]">
          Historical purchase and selling prices recorded from confirmed
          purchases and completed sales.
        </p>

        {priceHistory.length === 0 ? (
          <p className="mt-6 text-[var(--text-secondary)]">
            No price history recorded for this product.
          </p>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="px-3 py-3">Date</th>
                  <th className="px-3 py-3">Type</th>
                  <th className="px-3 py-3 text-right">Price</th>
                  <th className="px-3 py-3 text-right">Quantity</th>
                  <th className="px-3 py-3">Reference</th>
                  <th className="px-3 py-3">Payment</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[var(--border)]">
                {priceHistory.map((entry) => (
                  <tr key={entry.id}>
                    <td className="px-3 py-3.5">
                      {new Date(entry.date).toLocaleString()}
                    </td>
                    <td className="px-3 py-3.5">{entry.type}</td>
                    <td className="px-3 py-3.5 text-right">
                      ₹{Number(entry.price).toFixed(2)}
                    </td>
                    <td className="px-3 py-3.5 text-right">
                      {Number(entry.quantity)}
                    </td>
                    <td className="px-3 py-3.5">{entry.reference}</td>
                    <td className="px-3 py-3.5">
                      {entry.paymentMode || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-6 rounded-3xl border border-[var(--border)] bg-white p-6 sm:p-8">
        <h2 className="text-2xl">Stock movement history</h2>

        {movements.length === 0 ? (
          <p className="mt-6 text-[var(--text-secondary)]">
            No stock movements recorded for this product.
          </p>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[750px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="px-3 py-3">Date</th>
                  <th className="px-3 py-3">Type</th>
                  <th className="px-3 py-3 text-right">Quantity</th>
                  <th className="px-3 py-3">Note</th>
                  <th className="px-3 py-3">Reference</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[var(--border)]">
                {movements.map((movement) => (
                  <tr key={movement.id}>
                    <td className="px-3 py-3.5">
                      {new Date(movement.createdAt).toLocaleString()}
                    </td>
                    <td className="px-3 py-3.5">{movement.type}</td>
                    <td className="px-3 py-3.5 text-right">
                      {Number(movement.quantity)}
                    </td>
                    <td className="px-3 py-3.5">
                      {movement.note || "—"}
                    </td>
                    <td className="px-3 py-3.5 font-mono text-[13px]">
                      {movement.referenceId || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
