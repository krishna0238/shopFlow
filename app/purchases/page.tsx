"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const BUSINESS_ID = "3b4fc147-7ea2-495f-a64e-878dfdabc158";

type PurchaseOrder = {
  id: string;
  status: string;
  createdAt: string;
  supplier: {
    id: string;
    name: string;
  };
};

type Supplier = {
  id: string;
  name: string;
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
  };
};

export default function PurchasesPage() {
  const [purchaseOrders, setPurchaseOrders] = useState<
    PurchaseOrder[]
  >([]);

  const [purchaseInvoices, setPurchaseInvoices] = useState<
    PurchaseInvoice[]
  >([]);

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [totalAmount, setTotalAmount] = useState("");

  const [loading, setLoading] = useState(true);
  const [creatingInvoice, setCreatingInvoice] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function loadPurchaseOrders() {
    const response = await fetch(
      `/api/purchase-orders?businessId=${BUSINESS_ID}`
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || "Failed to load purchase orders"
      );
    }

    setPurchaseOrders(data.purchaseOrders);
  }

  async function loadPurchaseInvoices() {
    const response = await fetch(
      `/api/purchase-invoices?businessId=${BUSINESS_ID}`
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || "Failed to load purchase invoices"
      );
    }

    setPurchaseInvoices(data.purchaseInvoices);
  }

  async function loadSuppliers() {
    const response = await fetch(
      `/api/suppliers?businessId=${BUSINESS_ID}`
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || "Failed to load suppliers"
      );
    }

    setSuppliers(data.suppliers);
  }

  async function loadPurchases() {
    try {
      setLoading(true);
      setError("");

      await Promise.all([
        loadPurchaseOrders(),
        loadPurchaseInvoices(),
        loadSuppliers(),
      ]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load purchases"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPurchases();
  }, []);

  async function handleCreateInvoice(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setCreatingInvoice(true);
    setError("");
    setSuccessMessage("");

    try {
      if (!supplierId) {
        throw new Error("Please select a supplier");
      }

      if (!totalAmount || Number(totalAmount) < 0) {
        throw new Error("Please enter a valid total amount");
      }

      const response = await fetch(
        "/api/purchase-invoices",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            businessId: BUSINESS_ID,
            supplierId,
            invoiceNumber:
              invoiceNumber.trim() || undefined,
            invoiceDate: invoiceDate
              ? new Date(invoiceDate).toISOString()
              : undefined,
            totalAmount: Number(totalAmount),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to create purchase invoice"
        );
      }

      setSuccessMessage(
        "Purchase invoice created successfully"
      );

      setInvoiceNumber("");
      setInvoiceDate("");
      setSupplierId("");
      setTotalAmount("");

      await loadPurchaseInvoices();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create purchase invoice"
      );
    } finally {
      setCreatingInvoice(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen p-6">
        <div className="mx-auto max-w-7xl">
          <p className="text-gray-400">
            Loading purchases...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">
            Purchases
          </h1>

          <p className="mt-2 text-gray-400">
            Manage supplier purchase orders and invoices.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border bg-white p-6 text-gray-900 shadow-sm">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 rounded-lg border bg-white p-6 text-gray-900 shadow-sm">
            <p className="text-green-600">
              {successMessage}
            </p>
          </div>
        )}

        <section className="mb-8 rounded-lg border bg-white p-6 text-gray-900 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">
            Create Purchase Invoice
          </h2>

          <form
            onSubmit={handleCreateInvoice}
            className="grid gap-4 sm:grid-cols-2"
          >
            <div>
              <label className="mb-1 block text-sm font-medium">
                Supplier
              </label>

              <select
                value={supplierId}
                onChange={(event) =>
                  setSupplierId(event.target.value)
                }
                className="w-full rounded border px-3 py-2"
              >
                <option value="">
                  Select supplier
                </option>

                {suppliers.map((supplier) => (
                  <option
                    key={supplier.id}
                    value={supplier.id}
                  >
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Invoice Number
              </label>

              <input
                type="text"
                value={invoiceNumber}
                onChange={(event) =>
                  setInvoiceNumber(event.target.value)
                }
                placeholder="INV-002"
                className="w-full rounded border px-3 py-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Invoice Date
              </label>

              <input
                type="date"
                value={invoiceDate}
                onChange={(event) =>
                  setInvoiceDate(event.target.value)
                }
                className="w-full rounded border px-3 py-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Total Amount
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={totalAmount}
                onChange={(event) =>
                  setTotalAmount(event.target.value)
                }
                placeholder="0.00"
                className="w-full rounded border px-3 py-2"
              />
            </div>

            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={creatingInvoice}
                className="rounded bg-blue-600 px-5 py-2 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {creatingInvoice
                  ? "Creating..."
                  : "Create Purchase Invoice"}
              </button>
            </div>
          </form>
        </section>

        <section className="mb-8 rounded-lg border bg-white p-6 text-gray-900 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">
            Purchase Orders
          </h2>

          {purchaseOrders.length === 0 ? (
            <p className="text-gray-600">
              No purchase orders found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-left">
                    <th className="px-4 py-3 font-semibold">
                      Supplier
                    </th>

                    <th className="px-4 py-3 font-semibold">
                      Status
                    </th>

                    <th className="px-4 py-3 font-semibold">
                      Created
                    </th>

                    <th className="px-4 py-3 font-semibold">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {purchaseOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-gray-200 last:border-0"
                    >
                      <td className="px-4 py-3 font-medium">
                        {order.supplier.name}
                      </td>

                      <td className="px-4 py-3">
                        {order.status}
                      </td>

                      <td className="px-4 py-3 text-gray-700">
                        {new Date(
                          order.createdAt
                        ).toLocaleString()}
                      </td>

                      <td className="px-4 py-3">
                        <Link
                          href={`/purchases/${order.id}`}
                          className="font-medium text-blue-600 underline underline-offset-4 hover:text-blue-800"
                        >
                          View details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-lg border bg-white p-6 text-gray-900 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">
            Purchase Invoices
          </h2>

          {purchaseInvoices.length === 0 ? (
            <p className="text-gray-600">
              No purchase invoices found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-left">
                    <th className="px-4 py-3 font-semibold">
                      Invoice
                    </th>

                    <th className="px-4 py-3 font-semibold">
                      Supplier
                    </th>

                    <th className="px-4 py-3 font-semibold">
                      Total
                    </th>

                    <th className="px-4 py-3 font-semibold">
                      Status
                    </th>

                    <th className="px-4 py-3 font-semibold">
                      Date
                    </th>

                    <th className="px-4 py-3 font-semibold">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {purchaseInvoices.map((invoice) => (
                    <tr
                      key={invoice.id}
                      className="border-b border-gray-200 last:border-0"
                    >
                      <td className="px-4 py-3 font-medium">
                        {invoice.invoiceNumber || "Invoice"}
                      </td>

                      <td className="px-4 py-3">
                        {invoice.supplier.name}
                      </td>

                      <td className="px-4 py-3">
                        ₹
                        {Number(
                          invoice.totalAmount
                        ).toFixed(2)}
                      </td>

                      <td className="px-4 py-3">
                        {invoice.status}
                      </td>

                      <td className="px-4 py-3 text-gray-700">
                        {invoice.invoiceDate
                          ? new Date(
                              invoice.invoiceDate
                            ).toLocaleDateString()
                          : "—"}
                      </td>

                      <td className="px-4 py-3">
                        <Link
                          href={`/purchases/invoices/${invoice.id}`}
                          className="font-medium text-blue-600 underline underline-offset-4 hover:text-blue-800"
                        >
                          View Invoice
                        </Link>
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