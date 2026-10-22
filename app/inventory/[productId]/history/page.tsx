
"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";

type Product = {
  id: string;
  name: string;
  sku: string | null;
  purchasePrice: string | number;
  sellingPrice: string | number;
  stockQuantity: string | number;
  lowStockThreshold: string | number;
  isActive: boolean;
};

type InventoryMovement = {
  id: string;
  type: "PURCHASE" | "SALE" | "ADJUSTMENT";
  quantity: string | number;
  referenceId: string | null;
  note: string | null;
  createdAt: string;
};

export default function InventoryHistoryPage() {
  const params = useParams<{ productId: string }>();
  const router = useRouter();
  const productId = params.productId;

  const [product, setProduct] = useState<Product | null>(null);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [adjustmentQuantity, setAdjustmentQuantity] = useState("");
  const [adjustmentNote, setAdjustmentNote] = useState("");
  const [adjusting, setAdjusting] = useState(false);
  const [adjustmentError, setAdjustmentError] = useState("");
  const [adjustmentSuccess, setAdjustmentSuccess] = useState("");

  const loadHistory = useCallback(
    async (selectedProductId: string) => {
      try {
        setLoading(true);
        setError("");

        const productsResponse = await fetch(
          "/api/products?includeInactive=true"
        );

        if (productsResponse.status === 401) {
          router.replace("/login");
          return;
        }

        const productsData = await productsResponse.json();

        if (!productsResponse.ok) {
          throw new Error(
            productsData.error || "Failed to load product"
          );
        }

        const products: Product[] = Array.isArray(productsData)
          ? productsData
          : productsData.products ?? [];

        const selectedProduct = products.find(
          (item) => item.id === selectedProductId
        );

        if (!selectedProduct) {
          throw new Error("Product not found");
        }

        setProduct(selectedProduct);

        const historyResponse = await fetch(
          `/api/inventory?productId=${encodeURIComponent(selectedProductId)}`
        );

        if (historyResponse.status === 401) {
          router.replace("/login");
          return;
        }

        const historyData = await historyResponse.json();

        if (!historyResponse.ok) {
          throw new Error(
            historyData.error || "Failed to load inventory history"
          );
        }

        setMovements(historyData.movements ?? []);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load inventory history"
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
        void loadHistory(productId);
      }
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [loadHistory, productId]);

  async function handleAdjustment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setAdjustmentError("");
    setAdjustmentSuccess("");

    const quantity = Number(adjustmentQuantity);

    if (!Number.isFinite(quantity) || quantity === 0) {
      setAdjustmentError(
        "Adjustment quantity must be a non-zero number."
      );
      return;
    }

    if (!Number.isInteger(quantity)) {
      setAdjustmentError("Adjustment quantity must be a whole number.");
      return;
    }

    if (!adjustmentNote.trim()) {
      setAdjustmentError("Please provide a note for this adjustment.");
      return;
    }

    if (!product) {
      return;
    }

    const currentStock = Number(product.stockQuantity);
    const newStock = currentStock + quantity;

    if (newStock < 0) {
      setAdjustmentError(
        "This adjustment would make stock negative."
      );
      return;
    }

    if (!product.isActive) {
      setAdjustmentError("Inactive products cannot be adjusted.");
      return;
    }

    try {
      setAdjusting(true);

      const response = await fetch("/api/inventory/adjust", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: product.id,
          quantity,
          note: adjustmentNote.trim(),
        }),
      });

      const data = await response.json();

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || "Failed to adjust stock");
      }

      setAdjustmentQuantity("");
      setAdjustmentNote("");
      setAdjustmentSuccess("Stock adjusted successfully.");

      await loadHistory(product.id);
    } catch (err) {
      setAdjustmentError(
        err instanceof Error
          ? err.message
          : "Failed to adjust stock"
      );
    } finally {
      setAdjusting(false);
    }
  }

  function getMovementLabel(type: InventoryMovement["type"]) {
    switch (type) {
      case "PURCHASE":
        return "Purchase";
      case "SALE":
        return "Sale";
      case "ADJUSTMENT":
        return "Adjustment";
      default:
        return type;
    }
  }

  function formatQuantity(quantity: string | number) {
    const value = Number(quantity);
    return value > 0 ? `+${value}` : value.toString();
  }

  function getQuantityClass(quantity: string | number) {
    const value = Number(quantity);

    if (value > 0) {
      return "font-medium text-green-600";
    }

    if (value < 0) {
      return "font-medium text-red-600";
    }

    return "font-medium text-gray-600";
  }

  if (loading) {
    return (
      <main className="min-h-screen p-6">
        <div className="mx-auto max-w-7xl">
          <p className="text-[var(--text-secondary)]">Loading inventory history...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen p-6">
        <div className="mx-auto max-w-7xl">
          <button
            type="button"
            onClick={() => router.push("/inventory")}
            className="mb-6 font-medium text-[var(--text-primary)] underline underline-offset-4 hover:text-[var(--text-secondary)] rounded-full"
          >
            ← Back to inventory
          </button>

          <div className="rounded-lg border bg-white p-6 text-gray-900">
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </main>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-7xl">
        <button
          type="button"
          onClick={() => router.push("/inventory")}
          className="mb-6 font-medium text-[var(--text-primary)] underline underline-offset-4 hover:text-[var(--text-secondary)] rounded-full"
        >
          ← Back to inventory
        </button>

        <div className="mb-8">
          <h1 className="text-[40px] leading-[1.1] tracking-[-0.03em]">
            Inventory History
          </h1>
          <p className="mt-2 text-[var(--text-secondary)]">
            Complete stock movement history for this product.
          </p>
        </div>

        {!product.isActive && (
          <div className="mb-8 rounded-2xl border border-yellow-300 bg-yellow-50 p-4 text-yellow-900">
            <p className="font-semibold">This product is inactive.</p>
            <p className="mt-1 text-sm">
              This page is available for historical reference.
              Inactive products cannot be adjusted.
            </p>
          </div>
        )}

        <section className="mb-8 rounded-lg border bg-white p-6 text-gray-900">
          <div className="grid gap-6 md:grid-cols-4">
            <div>
              <p className="text-sm text-gray-500">Product</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">
                {product.name}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">SKU</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">
                {product.sku || "—"}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Current stock</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">
                {product.stockQuantity}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Low-stock threshold</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">
                {product.lowStockThreshold}
              </p>
            </div>
          </div>
        </section>

        {product.isActive && (
          <section className="mb-8 rounded-lg border bg-white p-6 text-gray-900">
            <div className="mb-5">
              <h2 className="text-2xl font-semibold text-gray-900">
                Adjust Stock
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Record a physical stock correction or other inventory
                adjustment.
              </p>
            </div>

            <form
              onSubmit={handleAdjustment}
              className="grid gap-4 md:grid-cols-3"
            >
              <div>
                <label
                  htmlFor="adjustment-quantity"
                  className="mb-1 block text-sm font-medium text-gray-900"
                >
                  Quantity
                </label>

                <input
                  id="adjustment-quantity"
                  type="number"
                  step="1"
                  value={adjustmentQuantity}
                  onChange={(event) =>
                    setAdjustmentQuantity(event.target.value)
                  }
                  placeholder="Example: +2 or -2"
                  className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-gray-900 placeholder:text-[var(--text-secondary)]"
                />

                <p className="mt-1 text-xs text-gray-500">
                  Use a positive number to increase stock or a negative
                  number to decrease it.
                </p>
              </div>

              <div>
                <label
                  htmlFor="adjustment-note"
                  className="mb-1 block text-sm font-medium text-gray-900"
                >
                  Reason
                </label>

                <input
                  id="adjustment-note"
                  type="text"
                  value={adjustmentNote}
                  onChange={(event) =>
                    setAdjustmentNote(event.target.value)
                  }
                  placeholder="Example: Physical stock count"
                  className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-gray-900 placeholder:text-[var(--text-secondary)]"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={adjusting}
                  className="w-full rounded-full bg-black px-5 py-2 font-medium text-white disabled:opacity-50"
                >
                  {adjusting ? "Adjusting..." : "Adjust Stock"}
                </button>
              </div>
            </form>

            {adjustmentError && (
              <p className="mt-4 text-sm text-red-600">
                {adjustmentError}
              </p>
            )}

            {adjustmentSuccess && (
              <p className="mt-4 text-sm font-medium text-green-600">
                {adjustmentSuccess}
              </p>
            )}
          </section>
        )}

        <section className="rounded-lg border bg-white p-6 text-gray-900">
          <div className="mb-4">
            <h2 className="text-2xl font-semibold text-gray-900">
              Stock Movements
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Every recorded change to this product&apos;s stock.
            </p>
          </div>

          {movements.length === 0 ? (
            <p className="text-gray-600">
              No inventory movements found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-left">
                    <th className="px-4 py-3 font-semibold text-gray-900">
                      Date
                    </th>
                    <th className="px-4 py-3 font-semibold text-gray-900">
                      Type
                    </th>
                    <th className="px-4 py-3 font-semibold text-gray-900">
                      Quantity
                    </th>
                    <th className="px-4 py-3 font-semibold text-gray-900">
                      Reference
                    </th>
                    <th className="px-4 py-3 font-semibold text-gray-900">
                      Note
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {movements.map((movement) => (
                    <tr
                      key={movement.id}
                      className="border-b border-gray-200 last:border-0"
                    >
                      <td className="px-4 py-3 text-gray-900">
                        {new Date(movement.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-gray-900">
                        {getMovementLabel(movement.type)}
                      </td>
                      <td
                        className={`px-4 py-3 ${getQuantityClass(
                          movement.quantity
                        )}`}
                      >
                        {formatQuantity(movement.quantity)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {movement.referenceId || "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-900">
                        {movement.note || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
