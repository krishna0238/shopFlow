
"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  const [businessName, setBusinessName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessName,
          ownerName,
          ownerEmail,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          setError("An account with this email already exists.");
        } else if (response.status === 400) {
          setError("Please check your details and try again.");
        } else {
          setError(data.error ?? "Registration failed. Please try again.");
        }
        return;
      }

      router.replace("/login?registered=1");
    } catch (err) {
      console.error("Registration request failed:", err);
      setError("Unable to connect. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-4 py-12 text-[var(--text-primary)]">
      <section className="w-full max-w-lg rounded-3xl bg-[var(--surface-muted)] p-7 sm:p-10">
        <Link
          href="/"
          className="font-serif text-[26px] leading-none tracking-[-0.03em] text-[var(--text-primary)]"
        >
          ShopFlow
        </Link>

        <div className="mt-8">
          <p className="text-[14px] text-[var(--text-secondary)]">
            Get started
          </p>

          <h1 className="text-[40px] leading-[1.1] tracking-[-0.03em]">
            Create your ShopFlow account
          </h1>

          <p className="mt-3 text-[15px] leading-6 text-[var(--text-secondary)]">
            Set up your business workspace to manage your shop in one place.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label
              htmlFor="businessName"
              className="mb-2 block text-[14px] font-medium"
            >
              Business name
            </label>
            <input
              id="businessName"
              name="businessName"
              type="text"
              autoComplete="organization"
              required
              maxLength={120}
              value={businessName}
              onChange={(event) => setBusinessName(event.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-[16px] outline-none"
              placeholder="e.g. Sri Lakshmi Stores"
            />
          </div>

          <div>
            <label
              htmlFor="ownerName"
              className="mb-2 block text-[14px] font-medium"
            >
              Owner name
            </label>
            <input
              id="ownerName"
              name="ownerName"
              type="text"
              autoComplete="name"
              required
              maxLength={120}
              value={ownerName}
              onChange={(event) => setOwnerName(event.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-[16px] outline-none"
              placeholder="Your full name"
            />
          </div>

          <div>
            <label
              htmlFor="ownerEmail"
              className="mb-2 block text-[14px] font-medium"
            >
              Email address
            </label>
            <input
              id="ownerEmail"
              name="ownerEmail"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              value={ownerEmail}
              onChange={(event) => setOwnerEmail(event.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-[16px] outline-none"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-[14px] font-medium"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={128}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-[16px] outline-none"
              placeholder="At least 8 characters"
            />
            <p className="mt-2 text-[13px] text-[var(--text-secondary)]">
              Use at least 8 characters.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="sf-btn w-full"
          >
            {submitting ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-[15px] text-[var(--text-secondary)]">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-[var(--text-primary)] underline underline-offset-4"
          >
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
}
