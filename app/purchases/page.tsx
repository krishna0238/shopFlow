"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
  const router = useRouter();

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [purchaseInvoices, setPurchaseInvoices] = useState<PurchaseInvoice[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [supplierId, setSupplierId] = useState("");

  const [loading, setLoading] = useState(true);
  const [creatingInvoice, setCreatingInvoice] = useState(false);
  const [scanningOcr, setScanningOcr] = useState(false);
  const [ocrMessage, setOcrMessage] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadPurchaseOrders = useCallback(async () => {
    const response = await fetch("/api/purchase-orders");

    if (response.status === 401) {
      router.replace("/login");
      throw new Error("Please log in to view purchases.");
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to load purchase orders");
    }

    setPurchaseOrders(data.purchaseOrders ?? []);
  }, [router]);

  const loadPurchaseInvoices = useCallback(async () => {
    const response = await fetch("/api/purchase-invoices");

    if (response.status === 401) {
      router.replace("/login");
      throw new Error("Please log in to view purchases.");
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to load purchase invoices");
    }

    setPurchaseInvoices(data.purchaseInvoices ?? []);
  }, [router]);

  const loadSuppliers = useCallback(async () => {
    const response = await fetch("/api/suppliers");

    if (response.status === 401) {
      router.replace("/login");
      throw new Error("Please log in to view purchases.");
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to load suppliers");
    }

    setSuppliers(data.suppliers ?? []);
  }, [router]);

  const loadPurchases = useCallback(async () => {
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
        err instanceof Error ? err.message : "Failed to load purchases"
      );
    } finally {
      setLoading(false);
    }
  }, [loadPurchaseOrders, loadPurchaseInvoices, loadSuppliers]);

  useEffect(() => {
    let cancelled = false;

    const timeoutId = window.setTimeout(() => {
      if (!cancelled) {
        void loadPurchases();
      }
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [loadPurchases]);

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

      const response = await fetch("/api/purchase-invoices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          supplierId,
          invoiceNumber: invoiceNumber.trim() || undefined,
          invoiceDate: invoiceDate
            ? new Date(invoiceDate).toISOString()
            : undefined,
        }),
      });

      if (response.status === 401) {
        router.replace("/login");
        throw new Error("Please log in to create a purchase invoice.");
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create purchase invoice");
      }

      setSuccessMessage("Purchase invoice created successfully");
      setInvoiceNumber("");
      setInvoiceDate("");
      setSupplierId("");

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
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-100" />
        <div className="shopflow-glass h-64 animate-pulse rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[10px] font-bold text-[var(--accent)]">
          Inventory Inflow & Invoices
        </p>
        <h1 className="mt-2 text-[40px] leading-[1.1] tracking-[-0.03em] text-[var(--text-primary)]">
          Purchases
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Manage supplier purchase orders and purchase invoices.
        </p>
      </div>

        {error && (
          <div className="mb-6 rounded-lg border bg-white p-6 text-gray-900">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 rounded-lg border bg-white p-6 text-gray-900">
            <p className="text-green-600">{successMessage}</p>
          </div>
        )}

        <section className="mb-8 rounded-lg border bg-white p-6 text-gray-900">
          <h2 className="mb-4 text-2xl font-semibold">
            Create Purchase Invoice
          </h2>

          <form
            onSubmit={handleCreateInvoice}
            className="grid gap-4 sm:grid-cols-2"
          >
            {/* AI OCR Scanner Banner */}
            <div className="sm:col-span-2 rounded-xl border border-[var(--border)] bg-blue-50/60 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">✨</span>
                  <div>
                    <p className="text-xs font-semibold text-[var(--text-primary)]">
                      AI Supplier Invoice OCR
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      Upload photo or scan of vendor bill to auto-extract invoice number, date, and supplier
                    </p>
                  </div>
                </div>

                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[var(--accent-hover)]">
                  <span>📷</span>
                  {scanningOcr ? "Scanning with AI..." : "Scan Bill Photo"}
                  <input
                    type="file"
                    accept="image/*"
                    disabled={scanningOcr}
                    className="sr-only rounded-xl"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setScanningOcr(true);
                      setOcrMessage("");
                      try {
                        const fd = new FormData();
                        fd.append("file", file);
                        const res = await fetch("/api/purchase-invoices/ocr", {
                          method: "POST",
                          body: fd,
                        });
                        const data = await res.json();
                        if (res.ok && data.extracted) {
                          if (data.extracted.invoiceNumber) {
                            setInvoiceNumber(data.extracted.invoiceNumber);
                          }
                          if (data.extracted.invoiceDate) {
                            setInvoiceDate(data.extracted.invoiceDate);
                          }
                          if (data.extracted.supplierId) {
                            setSupplierId(data.extracted.supplierId);
                          }
                          setOcrMessage(
                            `✨ Extracted: ${
                              data.extracted.invoiceNumber
                                ? `Invoice #${data.extracted.invoiceNumber}`
                                : ""
                            }${
                              data.extracted.supplierName
                                ? ` from ${data.extracted.supplierName}`
                                : ""
                            }${
                              data.extracted.totalAmount
                                ? ` (Amount: ₹${data.extracted.totalAmount})`
                                : ""
                            }`
                          );
                        } else {
                          setOcrMessage(
                            data.error ?? "Could not extract text from invoice"
                          );
                        }
                      } catch {
                        setOcrMessage("Failed to process invoice image");
                      } finally {
                        setScanningOcr(false);
                        e.target.value = "";
                      }
                    }}
                  />
                </label>
              </div>

              {ocrMessage && (
                <p className="mt-2 text-xs font-medium text-blue-900">
                  {ocrMessage}
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="supplierId"
                className="mb-1 block text-sm font-medium"
              >
                Supplier
              </label>

              <select
                id="supplierId"
                value={supplierId}
                onChange={(event) => setSupplierId(event.target.value)}
                required
                className="w-full rounded-xl border px-3 py-2"
              >
                <option value="">Select supplier</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="invoiceNumber"
                className="mb-1 block text-sm font-medium"
              >
                Invoice Number
              </label>

              <input
                id="invoiceNumber"
                type="text"
                value={invoiceNumber}
                onChange={(event) => setInvoiceNumber(event.target.value)}
                placeholder="INV-002"
                className="w-full rounded-xl border px-3 py-2"
              />
            </div>

            <div>
              <label
                htmlFor="invoiceDate"
                className="mb-1 block text-sm font-medium"
              >
                Invoice Date
              </label>

              <input
                id="invoiceDate"
                type="date"
                value={invoiceDate}
                onChange={(event) => setInvoiceDate(event.target.value)}
                className="w-full rounded-xl border px-3 py-2"
              />
            </div>

            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={creatingInvoice}
                className="rounded-full bg-[var(--accent)] px-5 py-2 font-medium text-white hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {creatingInvoice ? "Creating..." : "Create Purchase Invoice"}
              </button>
            </div>
          </form>
        </section>

        <section className="mb-8 rounded-lg border bg-white p-6 text-gray-900">
          <h2 className="mb-4 text-2xl font-semibold">Purchase Orders</h2>

          {purchaseOrders.length === 0 ? (
            <p className="text-gray-600">No purchase orders found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-left">
                    <th className="px-4 py-3 font-semibold">Supplier</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Created</th>
                    <th className="px-4 py-3 font-semibold">Action</th>
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
                      <td className="px-4 py-3">{order.status}</td>
                      <td className="px-4 py-3 text-gray-700">
                        {new Date(order.createdAt).toLocaleString()}
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

        <section className="rounded-lg border bg-white p-6 text-gray-900">
          <h2 className="mb-4 text-2xl font-semibold">Purchase Invoices</h2>

          {purchaseInvoices.length === 0 ? (
            <p className="text-gray-600">No purchase invoices found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-left">
                    <th className="px-4 py-3 font-semibold">Invoice</th>
                    <th className="px-4 py-3 font-semibold">Supplier</th>
                    <th className="px-4 py-3 font-semibold">Total</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Date</th>
                    <th className="px-4 py-3 font-semibold">Action</th>
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
                        ₹{Number(invoice.totalAmount).toFixed(2)}
                      </td>
                      <td className="px-4 py-3">{invoice.status}</td>
                      <td className="px-4 py-3 text-gray-700">
                        {invoice.invoiceDate
                          ? new Date(invoice.invoiceDate).toLocaleDateString()
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
  );
}