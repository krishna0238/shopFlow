"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

const BUSINESS_ID = "3b4fc147-7ea2-495f-a64e-878dfdabc158";

type SaleItem = {
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

type Sale = {
  id: string;
  totalAmount: string | number;
  paymentMode: string;
  createdAt: string;
  customer: {
    id: string;
    name: string;
    phone: string | null;
  } | null;
  items: SaleItem[];
};

export default function SaleDetailsPage() {
  const params = useParams();
  const saleId = params.saleId as string;

  const [sale, setSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadSale() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/sales?businessId=${BUSINESS_ID}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to load sales"
        );
      }

      const foundSale = data.sales.find(
        (item: Sale) => item.id === saleId
      );

      if (!foundSale) {
        throw new Error("Sale not found");
      }

      setSale(foundSale);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load sale"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSale();
  }, [saleId]);

  if (loading) {
    return (
      <main className="min-h-screen p-6">
        <div className="mx-auto max-w-5xl">
          <p className="text-gray-400">
            Loading sale...
          </p>
        </div>
      </main>
    );
  }

  if (error || !sale) {
    return (
      <main className="min-h-screen p-6">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-lg border bg-white p-6 text-gray-900 shadow-sm">
            <p className="text-red-600">
              {error || "Sale not found"}
            </p>

            <Link
              href="/sales"
              className="mt-4 inline-block font-medium text-blue-600 underline underline-offset-4 hover:text-blue-800"
            >
              ← Back to Sales
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
            href="/sales"
            className="font-medium text-blue-600 underline underline-offset-4 hover:text-blue-800"
          >
            ← Back to Sales
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">
            Sale Details
          </h1>

          <p className="mt-2 text-gray-400">
            {new Date(sale.createdAt).toLocaleString()}
          </p>
        </div>

        <section className="mb-6 rounded-lg border bg-white p-6 text-gray-900 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">
            Sale Information
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-gray-500">
                Sale ID
              </p>

              <p className="break-all font-medium">
                {sale.id}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Payment Mode
              </p>

              <p className="font-medium">
                {sale.paymentMode}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Date
              </p>

              <p className="font-medium">
                {new Date(
                  sale.createdAt
                ).toLocaleString()}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Total
              </p>

              <p className="text-lg font-semibold">
                ₹
                {Number(sale.totalAmount).toFixed(2)}
              </p>
            </div>
          </div>
        </section>

        <section className="mb-6 rounded-lg border bg-white p-6 text-gray-900 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">
            Customer
          </h2>

          {sale.customer ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-gray-500">
                  Name
                </p>

                <p className="font-medium">
                  {sale.customer.name}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Phone
                </p>

                <p className="font-medium">
                  {sale.customer.phone || "—"}
                </p>
              </div>

              <div>
                <Link
                  href={`/customers/${sale.customer.id}`}
                  className="font-medium text-blue-600 underline underline-offset-4 hover:text-blue-800"
                >
                  View Customer
                </Link>
              </div>
            </div>
          ) : (
            <p className="text-gray-600">
              Walk-in customer / no customer attached.
            </p>
          )}
        </section>

        <section className="rounded-lg border bg-white p-6 text-gray-900 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              Sale Items
            </h2>

            <span className="text-sm text-gray-500">
              {sale.items.length} item
              {sale.items.length === 1 ? "" : "s"}
            </span>
          </div>

          {sale.items.length === 0 ? (
            <p className="text-gray-600">
              No sale items found.
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
                  {sale.items.map((item) => (
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
                        ₹
                        {Number(
                          item.unitPrice
                        ).toFixed(2)}
                      </td>

                      <td className="px-4 py-3">
                        ₹
                        {Number(item.total).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="mt-6 rounded-lg border bg-white p-6 text-gray-900 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-lg font-semibold">
              Sale Total
            </p>

            <p className="text-2xl font-bold">
              ₹
              {Number(sale.totalAmount).toFixed(2)}
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}