
"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const registered = searchParams.get("registered") === "1";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setError("Invalid email or password.");
        } else if (response.status === 400) {
          setError("Enter a valid email address and password.");
        } else {
          setError(data.error ?? "Login failed. Please try again.");
        }
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      console.error("Login request failed:", err);
      setError("Unable to connect. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-4 py-12 text-[var(--text-primary)]">
      <section className="w-full max-w-md rounded-3xl bg-[var(--surface-muted)] p-7 sm:p-10">
        <Link
          href="/"
          className="font-serif text-[26px] leading-none tracking-[-0.03em] text-[var(--text-primary)]"
        >
          ShopFlow
        </Link>

        <div className="mt-8">
          <p className="text-[14px] text-[var(--text-secondary)]">
            Welcome back
          </p>

          <h1 className="text-[40px] leading-[1.1] tracking-[-0.03em]">
            Sign in to ShopFlow
          </h1>

          <p className="mt-3 text-[15px] leading-6 text-[var(--text-secondary)]">
            Access your shop&apos;s business workspace.
          </p>
        </div>

        {registered && (
          <div
            role="status"
            className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
          >
            Registration successful. Sign in with your new account.
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-[14px] font-medium"
            >
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
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
              autoComplete="current-password"
              required
              maxLength={128}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-[16px] outline-none"
              placeholder="Enter your password"
            />
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
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-[15px] text-[var(--text-secondary)]">
          New to ShopFlow?{" "}
          <Link
            href="/register"
            className="font-medium text-[var(--text-primary)] underline underline-offset-4"
          >
            Create an account
          </Link>
        </p>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-white px-4">
          <p className="text-sm text-[var(--text-secondary)]">Loading sign-in page...</p>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
