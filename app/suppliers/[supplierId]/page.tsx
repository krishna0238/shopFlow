"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

const BUSINESS_ID = "3b4fc147-7ea2-495f-a64e-878dfdabc158";

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
  const supplierId = params.supplierId as string;

  const [supplier, setSupplier] =
    useState<Supplier | null>(null);

  const [invoices, setInvoices] =
    useState<PurchaseInvoice[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadSupplierData() {
    try {
      setLoading(true);
      setError("");

      const [supplierResponse, invoicesResponse] =
        await Promise.all([
          fetch(
            `/api/suppliers?businessId=${BUSINESS_ID}`
          ),
          fetch(
            `/api/purchase-invoices?businessId=${BUSINESS_ID}`
          ),
        ]);

      const supplierData =
        await supplierResponse.json();

      const invoicesData =
        await invoicesResponse.json();

      if (!supplierResponse.ok) {
        throw new Error(
          supplierData.error ||
            "Failed to load suppliers"
        );
      }

      if (!invoicesResponse.ok) {
        throw new Error(
          invoicesData.error ||
            "Failed to load purchase invoices"
        );
      }

      const foundSupplier =
        supplierData.suppliers.find(
          (item: Supplier) =>
            item.id === supplierId
        );

      if (!foundSupplier) {
        throw new Error("Supplier not found");
      }

      setSupplier(foundSupplier);

      const supplierInvoices =
        invoicesData.purchaseInvoices.filter(
          (invoice: PurchaseInvoice) =>
            invoice.supplier.id === supplierId
        );

      setInvoices(supplierInvoices);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load supplier"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSupplierData();
  }, [supplierId]);

  if (loading) {
    return (
      <main className="min-h-screen p-6">
        <div className="mx-auto max-w-5xl">
          <p className="text-gray-400">
            Loading supplier...
          </p>
        </div>
      </main>
    );
  }

  if (error || !supplier) {
    return (
      <main className="min-h-screen p-6">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-lg border bg-white p-6 text-gray-900 shadow-sm">
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

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">
            Supplier Details
          </h1>

          <p className="mt-2 text-gray-400">
            {supplier.name}
          </p>
        </div>

        <section className="mb-6 rounded-lg border bg-white p-6 text-gray-900 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">
            Supplier Information
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-gray-500">
                Name
              </p>

              <p className="font-medium">
                {supplier.name}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Phone
              </p>

              <p className="font-medium">
                {supplier.phone || "—"}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Email
              </p>

              <p className="font-medium">
                {supplier.email || "—"}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Address
              </p>

              <p className="font-medium">
                {supplier.address || "—"}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-lg border bg-white p-6 text-gray-900 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              Purchase History
            </h2>

            <span className="text-sm text-gray-500">
              {invoices.length} invoice
              {invoices.length === 1 ? "" : "s"}
            </span>
          </div>

          {invoices.length === 0 ? (
            <p className="text-gray-600">
              No purchase invoices found for this
              supplier.
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
                      Date
                    </th>

                    <th className="px-4 py-3 font-semibold">
                      Status
                    </th>

                    <th className="px-4 py-3 font-semibold">
                      Total
                    </th>

                    <th className="px-4 py-3 font-semibold">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {invoices.map((invoice) => (
                    <tr
                      key={invoice.id}
                      className="border-b border-gray-200 last:border-0"
                    >
                      <td className="px-4 py-3 font-medium">
                        {invoice.invoiceNumber ||
                          "Invoice"}
                      </td>

                      <td className="px-4 py-3">
                        {invoice.invoiceDate
                          ? new Date(
                              invoice.invoiceDate
                            ).toLocaleDateString()
                          : "—"}
                      </td>

                      <td className="px-4 py-3">
                        {invoice.status}
                      </td>

                      <td className="px-4 py-3">
                        ₹
                        {Number(
                          invoice.totalAmount
                        ).toFixed(2)}
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