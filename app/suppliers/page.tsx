"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Supplier = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
};

export default function SuppliersPage() {
  const router = useRouter();

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

  const loadSuppliers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/suppliers");

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load suppliers");
      }

      setSuppliers(data.suppliers);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load suppliers"
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    let cancelled = false;

    const timeoutId = window.setTimeout(() => {
      if (!cancelled) {
        void loadSuppliers();
      }
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [loadSuppliers]);

  async function handleCreateSupplier(event: FormEvent<HTMLFormElement>) {
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
          name: name.trim(),
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          address: address.trim() || undefined,
        }),
      });

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create supplier");
      }

      setName("");
      setPhone("");
      setEmail("");
      setAddress("");
      setCreateMessage("Supplier created successfully");

      await loadSuppliers();
    } catch (err) {
      setCreateError(
        err instanceof Error ? err.message : "Failed to create supplier"
      );
    } finally {
      setCreating(false);
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
          Procurement & Vendors
        </p>
        <h1 className="mt-2 text-[40px] leading-[1.1] tracking-[-0.03em] text-[var(--text-primary)]">
          Suppliers
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Manage suppliers, purchase agreements, and vendor contacts.
        </p>
      </div>

      <section className="shopflow-glass rounded-3xl p-6">
        <h2 className="mb-4 text-base font-semibold text-[var(--text-primary)]">
          Add Supplier
        </h2>

          <form
            onSubmit={handleCreateSupplier}
            className="grid gap-4 md:grid-cols-2"
          >
            <div>
              <label
                htmlFor="supplier-name"
                className="mb-1 block text-sm font-medium"
              >
                Name
              </label>
              <input
                id="supplier-name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Supplier name"
                required
                className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-gray-900"
              />
            </div>

            <div>
              <label
                htmlFor="supplier-phone"
                className="mb-1 block text-sm font-medium"
              >
                Phone
              </label>
              <input
                id="supplier-phone"
                type="text"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="Phone number"
                className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-gray-900"
              />
            </div>

            <div>
              <label
                htmlFor="supplier-email"
                className="mb-1 block text-sm font-medium"
              >
                Email
              </label>
              <input
                id="supplier-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Email address"
                className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-gray-900"
              />
            </div>

            <div>
              <label
                htmlFor="supplier-address"
                className="mb-1 block text-sm font-medium"
              >
                Address
              </label>
              <input
                id="supplier-address"
                type="text"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                placeholder="Supplier address"
                className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-gray-900"
              />
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={creating}
                className="rounded-full bg-black px-5 py-2 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {creating ? "Creating..." : "Add Supplier"}
              </button>
            </div>
          </form>

          {createMessage && (
            <p className="mt-4 text-green-600">{createMessage}</p>
          )}

          {createError && (
            <p className="mt-4 text-red-600">{createError}</p>
          )}
        </section>

        {error && (
          <div className="mb-6 rounded-lg border bg-white p-6 text-gray-900">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        <section className="rounded-lg border bg-white p-6 text-gray-900">
          <h2 className="mb-4 text-2xl font-semibold">Supplier List</h2>

          {suppliers.length === 0 ? (
            <p className="text-gray-600">No suppliers found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-left">
                    <th className="px-4 py-3 font-semibold">Supplier</th>
                    <th className="px-4 py-3 font-semibold">Phone</th>
                    <th className="px-4 py-3 font-semibold">Email</th>
                    <th className="px-4 py-3 font-semibold">Address</th>
                    <th className="px-4 py-3 font-semibold">Action</th>
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
  );
}