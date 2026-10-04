"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

const BUSINESS_ID = "3b4fc147-7ea2-495f-a64e-878dfdabc158";

type Supplier = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
};

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  const [creating, setCreating] = useState(false);
  const [createMessage, setCreateMessage] = useState("");
  const [createError, setCreateError] = useState("");

  async function loadSuppliers() {
    try {
      setLoading(true);
      setError("");

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
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load suppliers"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSuppliers();
  }, []);

  async function handleCreateSupplier(event: FormEvent) {
    event.preventDefault();

    setCreateMessage("");
    setCreateError("");

    if (!name.trim()) {
      setCreateError("Supplier name is required");
      return;
    }

    try {
      setCreating(true);

      const response = await fetch("/api/suppliers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessId: BUSINESS_ID,
          name: name.trim(),
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          address: address.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to create supplier"
        );
      }

      setName("");
      setPhone("");
      setEmail("");
      setAddress("");

      setCreateMessage("Supplier created successfully");

      await loadSuppliers();
    } catch (err) {
      setCreateError(
        err instanceof Error
          ? err.message
          : "Failed to create supplier"
      );
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen p-6">
        <div className="mx-auto max-w-7xl">
          <p className="text-gray-400">
            Loading suppliers...
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
            Suppliers
          </h1>

          <p className="mt-2 text-gray-400">
            Manage suppliers and their purchasing information.
          </p>
        </div>

        <section className="mb-8 rounded-lg border bg-white p-6 text-gray-900 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">
            Add Supplier
          </h2>

          <form
            onSubmit={handleCreateSupplier}
            className="grid gap-4 md:grid-cols-2"
          >
            <div>
              <label className="mb-1 block text-sm font-medium">
                Name
              </label>

              <input
                type="text"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                placeholder="Supplier name"
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Phone
              </label>

              <input
                type="text"
                value={phone}
                onChange={(event) =>
                  setPhone(event.target.value)
                }
                placeholder="Phone number"
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="Email address"
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Address
              </label>

              <input
                type="text"
                value={address}
                onChange={(event) =>
                  setAddress(event.target.value)
                }
                placeholder="Supplier address"
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900"
              />
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={creating}
                className="rounded-md bg-black px-5 py-2 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {creating
                  ? "Creating..."
                  : "Add Supplier"}
              </button>
            </div>
          </form>

          {createMessage && (
            <p className="mt-4 text-green-600">
              {createMessage}
            </p>
          )}

          {createError && (
            <p className="mt-4 text-red-600">
              {createError}
            </p>
          )}
        </section>

        {error && (
          <div className="mb-6 rounded-lg border bg-white p-6 text-gray-900 shadow-sm">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        <section className="rounded-lg border bg-white p-6 text-gray-900 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">
            Supplier List
          </h2>

          {suppliers.length === 0 ? (
            <p className="text-gray-600">
              No suppliers found.
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
                      Phone
                    </th>
                    <th className="px-4 py-3 font-semibold">
                      Email
                    </th>
                    <th className="px-4 py-3 font-semibold">
                      Address
                    </th>
                    <th className="px-4 py-3 font-semibold">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {suppliers.map((supplier) => (
                    <tr
                      key={supplier.id}
                      className="border-b border-gray-200 last:border-0"
                    >
                      <td className="px-4 py-3 font-medium">
                        {supplier.name}
                      </td>

                      <td className="px-4 py-3 text-gray-700">
                        {supplier.phone || "—"}
                      </td>

                      <td className="px-4 py-3 text-gray-700">
                        {supplier.email || "—"}
                      </td>

                      <td className="px-4 py-3 text-gray-700">
                        {supplier.address || "—"}
                      </td>

                      <td className="px-4 py-3">
                        <Link
                          href={`/suppliers/${supplier.id}`}
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
      </div>
    </main>
  );
}