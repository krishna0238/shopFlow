"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Category = {
  id: string;
  businessId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export default function CategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      try {
        const response = await fetch("/api/categories");

        if (response.status === 401) {
          router.replace("/login");
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to load categories");
        }

        const data = await response.json();

        if (!cancelled) {
          setCategories(Array.isArray(data) ? data : data.categories ?? []);
          setError("");
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load categories"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadCategories();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Category name is required");
      setSuccess("");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await fetch("/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: trimmedName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to create category");
      }

      setName("");
      setSuccess("Category created successfully");

      const refreshResponse = await fetch("/api/categories");
      const refreshData = await refreshResponse.json();
      setCategories(
        Array.isArray(refreshData)
          ? refreshData
          : refreshData.categories ?? []
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create category"
      );
    } finally {
      setSaving(false);
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
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/inventory"
              className="text-xs font-semibold text-[var(--accent)] hover:underline"
            >
              ← Inventory
            </Link>
          </div>
          <h1 className="mt-2 text-[40px] leading-[1.1] tracking-[-0.03em] text-[var(--text-primary)]">
            Product Categories
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Organize products into logical groups for faster billing and reporting.
          </p>
        </div>
      </div>

      {/* Add Category Form */}
      <section className="shopflow-glass rounded-3xl p-6">
        <h2 className="mb-4 text-base font-semibold text-[var(--text-primary)]">
          Add New Category
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
          <input
            id="category-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Cables & Adapters, Mobile Accessories..."
            disabled={saving}
            className="flex-1 rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
          />

          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-[var(--accent)] px-6 py-2.5 text-xs font-medium text-white transition hover:bg-[var(--accent-hover)] disabled:opacity-50"
          >
            {saving ? "Adding..." : "Add Category"}
          </button>
        </form>

        {success && (
          <p className="mt-3 text-xs font-semibold text-emerald-700">{success}</p>
        )}
        {error && (
          <p className="mt-3 text-xs font-semibold text-red-600">{error}</p>
        )}
      </section>

      {/* Categories List */}
      <section className="shopflow-glass rounded-3xl p-6">
        <h2 className="mb-4 text-base font-semibold text-[var(--text-primary)]">
          Existing Categories ({categories.length})
        </h2>

        {categories.length === 0 ? (
          <p className="py-6 text-center text-sm text-[var(--text-secondary)]">
            No categories defined yet. Add your first category above.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {categories.map((c) => (
              <div
                key={c.id}
                className="shopflow-glass-interactive flex items-center justify-between rounded-3xl p-4"
              >
                <div>
                  <p className="font-semibold text-[var(--text-primary)]">
                    {c.name}
                  </p>
                  <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">
                    Added {new Date(c.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-base" aria-hidden="true">
                  🏷️
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
