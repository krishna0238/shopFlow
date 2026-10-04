"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

const BUSINESS_ID = "3b4fc147-7ea2-495f-a64e-878dfdabc158";

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
  const invoiceId = params.invoiceId as string;

  const [invoice, setInvoice] =
    useState<PurchaseInvoice | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unitPrice, setUnitPrice] = useState("");

  const [loading, setLoading] = useState(true);
  const [addingItem, setAddingItem] = useState(false);
  const [confirmingInvoice, setConfirmingInvoice] =
    useState(false);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function loadInvoice() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/purchase-invoices?businessId=${BUSINESS_ID}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to load purchase invoices"
        );
      }

      const foundInvoice = data.purchaseInvoices.find(
        (item: PurchaseInvoice) => item.id === invoiceId
      );

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
  }

  async function loadProducts() {
    try {
      const response = await fetch(
        `/api/products?businessId=${BUSINESS_ID}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to load products"
        );
      }

      setProducts(data.products);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load products"
      );
    }
  }

  useEffect(() => {
    loadInvoice();
    loadProducts();
  }, [invoiceId]);

  function handleProductChange(
    selectedProductId: string
  ) {
    setProductId(selectedProductId);

    const selectedProduct = products.find(
      (product) => product.id === selectedProductId
    );

    if (selectedProduct) {
      setUnitPrice(
        String(Number(selectedProduct.purchasePrice))
      );
    } else {
      setUnitPrice("");
    }
  }

  async function handleAddItem(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setAddingItem(true);
    setError("");
    setSuccessMessage("");

    try {
      if (!productId) {
        throw new Error("Please select a product");
      }

      if (!quantity || Number(quantity) <= 0) {
        throw new Error("Please enter a valid quantity");
      }

      if (!unitPrice || Number(unitPrice) < 0) {
        throw new Error("Please enter a valid unit price");
      }

      const response = await fetch(
        "/api/purchase-invoices/items",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            businessId: BUSINESS_ID,
            purchaseInvoiceId: invoiceId,
            productId,
            quantity: Number(quantity),
            unitPrice: Number(unitPrice),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to add invoice item"
        );
      }

      setSuccessMessage(
        "Invoice item added successfully"
      );

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
      const response = await fetch(
        "/api/purchase-invoices/confirm",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            businessId: BUSINESS_ID,
            purchaseInvoiceId: invoiceId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to confirm purchase invoice"
        );
      }

      setSuccessMessage(
        "Purchase invoice confirmed successfully"
      );

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
          <p className="text-gray-400">
            Loading purchase invoice...
          </p>
        </div>
      </main>
    );
  }

  if (error && !invoice) {
    return (
      <main className="min-h-screen p-6">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-lg border bg-white p-6 text-gray-900 shadow-sm">
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </main>
    );
  }

  if (!invoice) {
    return null;
  }

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <button
            onClick={() => {
              window.location.href = "/purchases";
            }}
            className="font-medium text-blue-600 underline underline-offset-4 hover:text-blue-800"
          >
            ← Back to Purchases
          </button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">
            Purchase Invoice
          </h1>

          <p className="mt-2 text-gray-400">
            {invoice.invoiceNumber || "Invoice"}
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border bg-white p-4 text-gray-900 shadow-sm">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 rounded-lg border bg-white p-4 text-gray-900 shadow-sm">
            <p className="text-green-600">
              {successMessage}
            </p>
          </div>
        )}

        <section className="mb-6 rounded-lg border bg-white p-6 text-gray-900 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">
            Invoice Information
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-gray-500">
                Invoice Number
              </p>
              <p className="font-medium">
                {invoice.invoiceNumber || "—"}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Status
              </p>
              <p className="font-medium">
                {invoice.status}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Invoice Date
              </p>
              <p className="font-medium">
                {invoice.invoiceDate
                  ? new Date(
                      invoice.invoiceDate
                    ).toLocaleDateString()
                  : "—"}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Total
              </p>
              <p className="font-medium">
                ₹{Number(invoice.totalAmount).toFixed(2)}
              </p>
            </div>
          </div>

          {invoice.status === "DRAFT" && (
            <div className="mt-6">
              <button
                type="button"
                onClick={handleConfirmInvoice}
                disabled={
                  confirmingInvoice ||
                  invoice.items.length === 0
                }
                className="rounded bg-green-600 px-5 py-2 font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {confirmingInvoice
                  ? "Confirming..."
                  : "Confirm Invoice"}
              </button>

              {invoice.items.length === 0 && (
                <p className="mt-2 text-sm text-gray-500">
                  Add at least one invoice item before
                  confirming.
                </p>
              )}
            </div>
          )}
        </section>

        <section className="mb-6 rounded-lg border bg-white p-6 text-gray-900 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">
            Supplier
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-gray-500">
                Name
              </p>
              <p className="font-medium">
                {invoice.supplier.name}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Phone
              </p>
              <p className="font-medium">
                {invoice.supplier.phone || "—"}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Email
              </p>
              <p className="font-medium">
                {invoice.supplier.email || "—"}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Address
              </p>
              <p className="font-medium">
                {invoice.supplier.address || "—"}
              </p>
            </div>
          </div>
        </section>

        {invoice.status === "DRAFT" && (
          <section className="mb-6 rounded-lg border bg-white p-6 text-gray-900 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold">
              Add Invoice Item
            </h2>

            <form
              onSubmit={handleAddItem}
              className="grid gap-4 sm:grid-cols-3"
            >
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Product
                </label>

                <select
                  value={productId}
                  onChange={(event) =>
                    handleProductChange(
                      event.target.value
                    )
                  }
                  className="w-full rounded border px-3 py-2"
                >
                  <option value="">
                    Select product
                  </option>

                  {products.map((product) => (
                    <option
                      key={product.id}
                      value={product.id}
                    >
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Quantity
                </label>

                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={quantity}
                  onChange={(event) =>
                    setQuantity(event.target.value)
                  }
                  placeholder="10"
                  className="w-full rounded border px-3 py-2"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Unit Price
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={unitPrice}
                  onChange={(event) =>
                    setUnitPrice(event.target.value)
                  }
                  placeholder="90"
                  className="w-full rounded border px-3 py-2"
                />
              </div>

              <div className="sm:col-span-3">
                <button
                  type="submit"
                  disabled={addingItem}
                  className="rounded bg-blue-600 px-5 py-2 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {addingItem
                    ? "Adding..."
                    : "Add Invoice Item"}
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="rounded-lg border bg-white p-6 text-gray-900 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">
            Invoice Items
          </h2>

          {invoice.items.length === 0 ? (
            <p className="text-gray-600">
              No items found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-left">
                    <th className="px-4 py-3 font-semibold">
                      Product
                    </th>

                    <th className="px-4 py-3 font-semibold">
                      SKU
                    </th>

                    <th className="px-4 py-3 font-semibold">
                      Quantity
                    </th>

                    <th className="px-4 py-3 font-semibold">
                      Unit Price
                    </th>

                    <th className="px-4 py-3 font-semibold">
                      Total
                    </th>
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