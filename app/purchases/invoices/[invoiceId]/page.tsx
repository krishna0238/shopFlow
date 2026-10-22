
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

type Product = {
  id: string;
  name: string;
  sku: string | null;
  purchasePrice: string | number;
};

type PurchaseInvoiceItem = {
  id: string;
  quantity: string | number;
  unitPrice: string | number;
  total: string | number;
  product: {
    id: string;
    name: string;
    sku: string | null;
  };
};

type PurchaseInvoice = {
  id: string;
  invoiceNumber: string | null;
  invoiceDate: string | null;
  totalAmount: string | number;
  status: string;
  createdAt: string;
  supplier: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    address: string | null;
  };
  items: PurchaseInvoiceItem[];
};

export default function PurchaseInvoiceDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.invoiceId as string;

  const [invoice, setInvoice] = useState<PurchaseInvoice | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unitPrice, setUnitPrice] = useState("");

  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);
  const [addingItem, setAddingItem] = useState(false);
  const [confirmingInvoice, setConfirmingInvoice] = useState(false);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadInvoice = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/purchase-invoices");

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load purchase invoices");
      }

      const foundInvoice = (
        data.purchaseInvoices as PurchaseInvoice[]
      ).find((item) => item.id === invoiceId);

      if (!foundInvoice) {
        throw new Error("Purchase invoice not found");
      }

      setInvoice(foundInvoice);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load purchase invoice"
      );
    } finally {
      setLoading(false);
    }
  }, [invoiceId, router]);

  const loadProducts = useCallback(async () => {
    try {
      setProductsLoading(true);

      const response = await fetch("/api/products");

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load products");
      }

      setProducts(data.products ?? []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load products"
      );
    } finally {
      setProductsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    let cancelled = false;

    const timeoutId = window.setTimeout(() => {
      if (!cancelled && invoiceId) {
        void loadInvoice();
        void loadProducts();
      }
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [invoiceId, loadInvoice, loadProducts]);

  function handleProductChange(selectedProductId: string) {
    setProductId(selectedProductId);

    const selectedProduct = products.find(
      (product) => product.id === selectedProductId
    );

    setUnitPrice(
      selectedProduct
        ? String(Number(selectedProduct.purchasePrice))
        : ""
    );
  }

  async function handleAddItem(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!productId) {
      setError("Please select a product");
      return;
    }

    const quantityNumber = Number(quantity);
    const unitPriceNumber = Number(unitPrice);

    if (!Number.isFinite(quantityNumber) || quantityNumber <= 0) {
      setError("Please enter a valid quantity");
      return;
    }

    if (!Number.isFinite(unitPriceNumber) || unitPriceNumber < 0) {
      setError("Please enter a valid unit price");
      return;
    }

    try {
      setAddingItem(true);

      const response = await fetch("/api/purchase-invoices/items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          purchaseInvoiceId: invoiceId,
          productId,
          quantity: quantityNumber,
          unitPrice: unitPriceNumber,
        }),
      });

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add invoice item");
      }

      setSuccessMessage("Invoice item added successfully");
      setProductId("");
      setQuantity("");
      setUnitPrice("");

      await loadInvoice();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to add invoice item"
      );
    } finally {
      setAddingItem(false);
    }
  }

  async function handleConfirmInvoice() {
    setConfirmingInvoice(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/purchase-invoices/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          purchaseInvoiceId: invoiceId,
        }),
      });

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to confirm purchase invoice"
        );
      }

      setSuccessMessage("Purchase invoice confirmed successfully");
      await loadInvoice();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to confirm purchase invoice"
      );
    } finally {
      setConfirmingInvoice(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen p-6">
        <div className="mx-auto max-w-5xl">
          <p className="text-[var(--text-secondary)]">Loading purchase invoice...</p>
        </div>
      </main>
    );
  }

  if (!invoice) {
    return (
      <main className="min-h-screen p-6">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-lg border bg-white p-6 text-gray-900">
            <p className="text-red-600">
              {error || "Purchase invoice not found"}
            </p>
            <Link
              href="/purchases"
              className="mt-4 inline-block font-medium text-blue-600 underline underline-offset-4 hover:text-blue-800"
            >
              Back to Purchases
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <Link
            href="/purchases"
            className="font-medium text-blue-600 underline underline-offset-4 hover:text-blue-800"
          >
            ← Back to Purchases
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-[40px] leading-[1.1] tracking-[-0.03em]">
            Purchase Invoice
          </h1>
          <p className="mt-2 text-[var(--text-secondary)]">
            {invoice.invoiceNumber || "Invoice"}
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border bg-white p-4 text-gray-900">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 rounded-lg border bg-white p-4 text-gray-900">
            <p className="text-green-600">{successMessage}</p>
          </div>
        )}

        <section className="mb-6 rounded-lg border bg-white p-6 text-gray-900">
          <h2 className="mb-4 text-2xl font-semibold">
            Invoice Information
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-gray-500">Invoice Number</p>
              <p className="font-medium">{invoice.invoiceNumber || "—"}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Status</p>
              <p className="font-medium">{invoice.status}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Invoice Date</p>
              <p className="font-medium">
                {invoice.invoiceDate
                  ? new Date(invoice.invoiceDate).toLocaleDateString()
                  : "—"}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Total</p>
              <p className="font-medium">
                ₹{Number(invoice.totalAmount).toFixed(2)}
              </p>
            </div>
          </div>

          {invoice.status === "DRAFT" && (
            <div className="mt-6">
              <button
                type="button"
                onClick={() => void handleConfirmInvoice()}
                disabled={
                  confirmingInvoice || invoice.items.length === 0
                }
                className="rounded-full bg-[var(--accent)] px-5 py-2 font-medium text-white hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {confirmingInvoice ? "Confirming..." : "Confirm Invoice"}
              </button>

              {invoice.items.length === 0 && (
                <p className="mt-2 text-sm text-gray-500">
                  Add at least one invoice item before confirming.
                </p>
              )}
            </div>
          )}
        </section>

        <section className="mb-6 rounded-lg border bg-white p-6 text-gray-900">
          <h2 className="mb-4 text-2xl font-semibold">Supplier</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="font-medium">{invoice.supplier.name}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="font-medium">{invoice.supplier.phone || "—"}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{invoice.supplier.email || "—"}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Address</p>
              <p className="font-medium">{invoice.supplier.address || "—"}</p>
            </div>
          </div>
        </section>

        {invoice.status === "DRAFT" && (
          <section className="mb-6 rounded-lg border bg-white p-6 text-gray-900">
            <h2 className="mb-4 text-2xl font-semibold">
              Add Invoice Item
            </h2>

            <form
              onSubmit={handleAddItem}
              className="grid gap-4 sm:grid-cols-3"
            >
              <div>
                <label
                  htmlFor="productId"
                  className="mb-1 block text-sm font-medium"
                >
                  Product
                </label>

                <select
                  id="productId"
                  value={productId}
                  onChange={(event) =>
                    handleProductChange(event.target.value)
                  }
                  disabled={productsLoading || addingItem}
                  required
                  className="w-full rounded-xl border px-3 py-2"
                >
                  <option value="">
                    {productsLoading ? "Loading products..." : "Select product"}
                  </option>

                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                      {product.sku ? ` (${product.sku})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="quantity"
                  className="mb-1 block text-sm font-medium"
                >
                  Quantity
                </label>

                <input
                  id="quantity"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                  disabled={addingItem}
                  required
                  placeholder="10"
                  className="w-full rounded-xl border px-3 py-2"
                />
              </div>

              <div>
                <label
                  htmlFor="unitPrice"
                  className="mb-1 block text-sm font-medium"
                >
                  Unit Price
                </label>

                <input
                  id="unitPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={unitPrice}
                  onChange={(event) => setUnitPrice(event.target.value)}
                  disabled={addingItem}
                  required
                  placeholder="90"
                  className="w-full rounded-xl border px-3 py-2"
                />
              </div>

              <div className="sm:col-span-3">
                <button
                  type="submit"
                  disabled={addingItem || productsLoading}
                  className="rounded-full bg-[var(--accent)] px-5 py-2 font-medium text-white hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {addingItem ? "Adding..." : "Add Invoice Item"}
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="rounded-lg border bg-white p-6 text-gray-900">
          <h2 className="mb-4 text-2xl font-semibold">Invoice Items</h2>

          {invoice.items.length === 0 ? (
            <p className="text-gray-600">No items found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-left">
                    <th className="px-4 py-3 font-semibold">Product</th>
                    <th className="px-4 py-3 font-semibold">SKU</th>
                    <th className="px-4 py-3 font-semibold">Quantity</th>
                    <th className="px-4 py-3 font-semibold">Unit Price</th>
                    <th className="px-4 py-3 font-semibold">Total</th>
                  </tr>
                </thead>

                <tbody>
                  {invoice.items.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-gray-200 last:border-0"
                    >
                      <td className="px-4 py-3 font-medium">
                        {item.product.name}
                      </td>
                      <td className="px-4 py-3">
                        {item.product.sku || "—"}
                      </td>
                      <td className="px-4 py-3">
                        {Number(item.quantity)}
                      </td>
                      <td className="px-4 py-3">
                        ₹{Number(item.unitPrice).toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        ₹{Number(item.total).toFixed(2)}
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
