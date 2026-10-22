
"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Customer = {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
};

type CreditTransaction = {
  id: string;
  type: string;
  amount: number;
  note?: string | null;
  createdAt: string;
};

type CreditResponse = {
  balance: number;
  transactions?: CreditTransaction[];
};

export default function CustomerDetailsPage() {
  const params = useParams<{ customerId: string }>();
  const router = useRouter();
  const customerId = params.customerId;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [transactionType, setTransactionType] = useState<"CREDIT" | "PAYMENT">(
    "CREDIT"
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadCustomer = useCallback(async () => {
    try {
      setError("");

      const customerResponse = await fetch("/api/customers");

      if (!customerResponse.ok) {
        if (customerResponse.status === 401) {
          router.replace("/login");
          return;
        }

        throw new Error("Could not load customer details.");
      }

      const customerData: { customers: Customer[] } =
        await customerResponse.json();

      const foundCustomer = customerData.customers.find(
        (item) => item.id === customerId
      );

      if (!foundCustomer) {
        setCustomer(null);
        setError("Customer not found.");
        return;
      }

      setCustomer(foundCustomer);

      const creditResponse = await fetch(
        `/api/credit?customerId=${encodeURIComponent(customerId)}`
      );

      if (!creditResponse.ok) {
        if (creditResponse.status === 401) {
          router.replace("/login");
          return;
        }

        throw new Error("Could not load customer credit history.");
      }

      const creditData: CreditResponse = await creditResponse.json();

      setBalance(creditData.balance);
      setTransactions(creditData.transactions ?? []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }, [customerId, router]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadCustomer();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadCustomer]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }

    if (transactionType === "PAYMENT" && numericAmount > balance) {
      setError("Payment cannot exceed the outstanding balance.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/credit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerId,
          type: transactionType,
          amount: numericAmount,
          note: note.trim() || undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          router.replace("/login");
          return;
        }

        throw new Error(result.error || "Could not save the transaction.");
      }

      setAmount("");
      setNote("");
      setMessage("Transaction saved successfully.");
      await loadCustomer();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <main className="p-6">Loading customer details...</main>;
  }

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <button
        type="button"
        onClick={() => router.push("/customers")}
        className="rounded-full border px-4 py-2"
      >
        Back to Customers
      </button>

      {error && (
        <p role="alert" className="rounded bg-red-100 p-3 text-red-800">
          {error}
        </p>
      )}

      {message && (
        <p
          role="status"
          className="rounded bg-green-100 p-3 text-green-800"
        >
          {message}
        </p>
      )}

      {customer && (
        <>
          <section className="rounded-lg border p-6">
            <h1 className="text-[36px] leading-[1.1]">{customer.name}</h1>
            <p className="mt-2">Phone: {customer.phone || "Not provided"}</p>
            <p>Email: {customer.email || "Not provided"}</p>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm text-gray-600">Outstanding balance</p>
                <p className="text-3xl font-bold">
                  ₹{balance.toFixed(2)}
                </p>
              </div>

              {balance > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const phone = customer.phone
                      ? customer.phone.replace(/[^0-9]/g, "")
                      : "";
                    const text = `Namaste ${customer.name},%0A%0AThis is a friendly reminder from your store regarding your outstanding Khata balance of *₹${balance.toFixed(
                      2
                    )}*.%0A%0APlease arrange to settle this at your earliest convenience.%0A%0AThank you!`;
                    const url = phone
                      ? `https://wa.me/${phone}?text=${text}`
                      : `https://wa.me/?text=${text}`;
                    window.open(url, "_blank");
                  }}
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-medium text-white transition hover:bg-[var(--accent-hover)]"
                >
                  <span>💬</span>
                  Send WhatsApp Reminder
                </button>
              )}
            </div>
          </section>

          <section className="rounded-lg border p-6">
            <h2 className="mb-4 text-2xl font-semibold">
              Record Credit or Payment
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="transactionType" className="mb-1 block">
                  Transaction type
                </label>
                <select
                  id="transactionType"
                  value={transactionType}
                  onChange={(event) =>
                    setTransactionType(
                      event.target.value as "CREDIT" | "PAYMENT"
                    )
                  }
                  className="w-full rounded-xl border p-2"
                >
                  <option value="CREDIT">Credit given</option>
                  <option value="PAYMENT">Payment received</option>
                </select>
              </div>

              <div>
                <label htmlFor="amount" className="mb-1 block">
                  Amount (₹)
                </label>
                <input
                  id="amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  className="w-full rounded-xl border p-2"
                />
              </div>

              <div>
                <label htmlFor="note" className="mb-1 block">
                  Note (optional)
                </label>
                <input
                  id="note"
                  type="text"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  className="w-full rounded-xl border p-2"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="rounded-full bg-[var(--accent)] px-4 py-2 text-white disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Transaction"}
              </button>
            </form>
          </section>

          <section className="rounded-lg border p-6">
            <h2 className="mb-4 text-2xl font-semibold">Transaction History</h2>

            {transactions.length === 0 ? (
              <p>No transactions recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr>
                      <th className="border-b p-3">Date</th>
                      <th className="border-b p-3">Type</th>
                      <th className="border-b p-3">Amount</th>
                      <th className="border-b p-3">Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction) => (
                      <tr key={transaction.id}>
                        <td className="border-b p-3">
                          {new Date(transaction.createdAt).toLocaleString()}
                        </td>
                        <td className="border-b p-3">{transaction.type}</td>
                        <td className="border-b p-3">
                          ₹{transaction.amount.toFixed(2)}
                        </td>
                        <td className="border-b p-3">
                          {transaction.note || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}
