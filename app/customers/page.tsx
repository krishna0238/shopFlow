
"use client";

import Link from "next/link";
import {
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";

type Customer = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
};

type CreditResponse = {
  balance: number;
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const [creating, setCreating] = useState(false);
  const [createMessage, setCreateMessage] = useState("");
  const [createError, setCreateError] = useState("");

  const loadCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/customers");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to load customers"
        );
      }

      const loadedCustomers: Customer[] = data.customers;
      setCustomers(loadedCustomers);

      const balanceEntries = await Promise.all(
        loadedCustomers.map(async (customer) => {
          try {
            const creditResponse = await fetch(
              `/api/credit?customerId=${encodeURIComponent(customer.id)}`
            );

            if (!creditResponse.ok) {
              return [customer.id, 0] as const;
            }

            const creditData: CreditResponse =
              await creditResponse.json();

            return [customer.id, creditData.balance] as const;
          } catch {
            return [customer.id, 0] as const;
          }
        })
      );

      setBalances(Object.fromEntries(balanceEntries));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load customers"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadCustomers();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadCustomers]);

  async function handleCreateCustomer(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setCreateMessage("");
    setCreateError("");

    if (!name.trim()) {
      setCreateError("Customer name is required");
      return;
    }

    try {
      setCreating(true);

      const response = await fetch("/api/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to create customer"
        );
      }

      setName("");
      setPhone("");
      setEmail("");

      setCreateMessage("Customer created successfully");

      await loadCustomers();
    } catch (err) {
      setCreateError(
        err instanceof Error
          ? err.message
          : "Failed to create customer"
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
          Khata & Customer Directory
        </p>
        <h1 className="mt-2 text-[40px] leading-[1.1] tracking-[-0.03em] text-[var(--text-primary)]">
          Customers
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Manage customer accounts, outstanding credit, and payment settlements.
        </p>
      </div>

        <section className="mb-8 rounded-lg border bg-white p-6 text-gray-900">
          <h2 className="mb-4 text-2xl font-semibold">
            Add Customer
          </h2>

          <form
            onSubmit={handleCreateCustomer}
            className="grid gap-4 md:grid-cols-3"
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
                placeholder="Customer name"
                className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-gray-900"
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
                className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-gray-900"
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
                className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-gray-900"
              />
            </div>

            <div className="md:col-span-3">
              <button
                type="submit"
                disabled={creating}
                className="rounded-full bg-black px-5 py-2 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {creating ? "Creating..." : "Add Customer"}
              </button>
            </div>
          </form>

          {createMessage && (
            <p role="status" className="mt-4 text-green-600">
              {createMessage}
            </p>
          )}

          {createError && (
            <p role="alert" className="mt-4 text-red-600">
              {createError}
            </p>
          )}
        </section>

        {error && (
          <div className="mb-6 rounded-lg border bg-white p-6 text-gray-900">
            <p role="alert" className="text-red-600">
              {error}
            </p>
          </div>
        )}

        <section className="rounded-lg border bg-white p-6 text-gray-900">
          <h2 className="mb-4 text-2xl font-semibold">
            Customer List
          </h2>

          {customers.length === 0 ? (
            <p className="text-gray-600">
              No customers found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-left">
                    <th className="px-4 py-3 font-semibold text-gray-900">
                      Customer
                    </th>
                    <th className="px-4 py-3 font-semibold text-gray-900">
                      Phone
                    </th>
                    <th className="px-4 py-3 font-semibold text-gray-900">
                      Email
                    </th>
                    <th className="px-4 py-3 font-semibold text-gray-900">
                      Outstanding
                    </th>
                    <th className="px-4 py-3 font-semibold text-gray-900">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {customers.map((customer) => {
                    const balance = balances[customer.id] ?? 0;

                    return (
                      <tr
                        key={customer.id}
                        className="border-b border-gray-200 last:border-0"
                      >
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {customer.name}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {customer.phone || "—"}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {customer.email || "—"}
                        </td>
                        <td className="px-4 py-3 font-medium">
                          ₹{balance.toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/customers/${customer.id}`}
                            className="font-medium text-blue-600 underline underline-offset-4 hover:text-blue-800"
                          >
                            View details
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
    </div>
  );
}
