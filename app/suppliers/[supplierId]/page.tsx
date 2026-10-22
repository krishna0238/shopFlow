"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Supplier = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
};

type PurchaseInvoice = {
  id: string;
  invoiceNumber: string | null;
  invoiceDate: string | null;
  totalAmount: string | number;
  status: string;
  supplier: {
    id: string;
    name: string;
  };
};

export default function SupplierDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const supplierId = params.supplierId as string;

  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSupplierData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      // The server determines the business from the authenticated session.
     
const [supplierResponse, invoicesResponse] = await Promise.all([
  fetch("/api/suppliers"),
  fetch(
    `/api/suppliers/${encodeURIComponent(supplierId)}/purchase-invoices`
  ),
]);


      if (
        supplierResponse.status === 401 ||
        invoicesResponse.status === 401
      ) {
        router.replace("/login");
        return;
      }

      const supplierData = await supplierResponse.json();
      const invoicesData = await invoicesResponse.json();

      if (!supplierResponse.ok) {
        throw new Error(
          supplierData.error || "Failed to load suppliers"
        );
      }

      if (!invoicesResponse.ok) {
        throw new Error(
          invoicesData.error || "Failed to load purchase invoices"
        );
      }

      const foundSupplier = supplierData.suppliers.find(
        (item: Supplier) => item.id === supplierId
      );

      if (!foundSupplier) {
        throw new Error("Supplier not found");
      }

      setSupplier(foundSupplier);

      
setInvoices(invoicesData.purchaseInvoices);

    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load supplier"
      );
    } finally {
      setLoading(false);
    }
  }, [supplierId, router]);

  useEffect(() => {
    let cancelled = false;

    const timeoutId = window.setTimeout(() => {
      if (!cancelled) {
        void loadSupplierData();
      }
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [loadSupplierData]);

  if (loading) {
    return (
      <main className="min-h-screen p-6">
        <div className="mx-auto max-w-5xl">
          <p className="text-[var(--text-secondary)]">Loading supplier...</p>
        </div>
      </main>
    );
  }

  if (error || !supplier) {
    return (
      <main className="min-h-screen p-6">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-lg border bg-white p-6 text-gray-900">
            <p className="text-red-600">
              {error || "Supplier not found"}
            </p>

            <Link
              href="/suppliers"
              className="mt-4 inline-block font-medium text-blue-600 underline underline-offset-4 hover:text-blue-800"
            >
              ← Back to Suppliers
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
            href="/suppliers"
            className="font-medium text-blue-600 underline underline-offset-4 hover:text-blue-800"
          >
            ← Back to Suppliers
          </Link>
        </div>

        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-[40px] leading-[1.1] tracking-[-0.03em] text-[var(--text-primary)]">
              {supplier.name}
            </h1>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Supplier profile and procurement ledger
            </p>
          </div>

          <Link
            href={`/suppliers/${supplier.id}/payments`}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-4 py-2.5 text-xs font-medium text-white transition hover:bg-[var(--accent-hover)]"
          >
            <span>💳</span>
            Vendor Khata & Payables →
          </Link>
        </div>

        <section className="mb-6 rounded-lg border bg-white p-6 text-gray-900">
          <h2 className="mb-4 text-2xl font-semibold">
            Supplier Information
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="font-medium">{supplier.name}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="font-medium">{supplier.phone || "—"}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{supplier.email || "—"}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Address</p>
              <p className="font-medium">{supplier.address || "—"}</p>
            </div>
          </div>
        </section>

        <section className="rounded-lg border bg-white p-6 text-gray-900">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Purchase History</h2>

            <span className="text-sm text-gray-500">
              {invoices.length} invoice{invoices.length === 1 ? "" : "s"}
            </span>
          </div>

          {invoices.length === 0 ? (
            <p className="text-gray-600">
              No purchase invoices found for this supplier.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-left">
                    <th className="px-4 py-3 font-semibold">Invoice</th>
                    <th className="px-4 py-3 font-semibold">Date</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Total</th>
                    <th className="px-4 py-3 font-semibold">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {invoices.map((invoice) => (
                    <tr
                      key={invoice.id}
                      className="border-b border-gray-200 last:border-0"
                    >
                      <td className="px-4 py-3 font-medium">
                        {invoice.invoiceNumber || "Invoice"}
                      </td>

                      <td className="px-4 py-3">
                        {invoice.invoiceDate
                          ? new Date(
                              invoice.invoiceDate
                            ).toLocaleDateString()
                          : "—"}
                      </td>

                      <td className="px-4 py-3">{invoice.status}</td>

                      <td className="px-4 py-3">
                        ₹{Number(invoice.totalAmount).toFixed(2)}
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