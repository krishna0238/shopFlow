"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/theme-provider";
import { StaffPanel } from "@/components/staff-panel";

type UserProfile = {
  id: string;
  name: string;
  email: string;
  role: "OWNER" | "MANAGER" | "STAFF";
  business: {
    id: string;
    name: string;
    gstin?: string | null;
    businessState?: string | null;
    createdAt: string;
  };
};

export default function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme, ready } = useTheme();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  const [editingGst, setEditingGst] = useState(false);
  const [gstinInput, setGstinInput] = useState("");
  const [businessStateInput, setBusinessStateInput] = useState("");
  const [savingGst, setSavingGst] = useState(false);
  const [gstError, setGstError] = useState("");

  async function handleSaveGst(e: React.FormEvent) {
    e.preventDefault();
    setSavingGst(true);
    setGstError("");
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gstin: gstinInput.trim() || undefined,
          businessState: businessStateInput.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save GST details");
      if (user) {
        setUser({
          ...user,
          business: {
            ...user.business,
            gstin: data.business.gstin,
            businessState: data.business.businessState,
          },
        });
      }
      setEditingGst(false);
    } catch (err) {
      setGstError(
        err instanceof Error ? err.message : "Failed to update GST settings"
      );
    } finally {
      setSavingGst(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function fetchMe() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch("/api/auth/me");

        if (res.status === 401) {
          router.replace("/login");
          return;
        }

        if (!res.ok) {
          throw new Error("Failed to load settings");
        }

        const data = await res.json();

        if (!cancelled) {
          setUser(data.user);
          setGstinInput(data.user.business.gstin ?? "");
          setBusinessStateInput(data.user.business.businessState ?? "");
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Error loading profile",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void fetchMe();

    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handleLogout() {
    try {
      setLoggingOut(true);

      const res = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (!res.ok) {
        throw new Error("Logout failed. Please try again.");
      }

      router.replace("/login");
      router.refresh();
    } catch (err) {
      console.error("Logout failed", err);
      setError(
        err instanceof Error ? err.message : "Logout failed. Please try again.",
      );
      setLoggingOut(false);
    }
  }

  if (loading || !ready) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-[var(--accent-soft)]" />
        <div className="shopflow-glass h-64 animate-pulse rounded-2xl" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="shopflow-glass rounded-3xl p-6">
        <p className="font-semibold text-[var(--danger)]">
          Unable to load settings
        </p>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          {error || "Your profile could not be loaded."}
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--background)]"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-[10px] font-bold text-[var(--text-secondary)]">
          Configuration & Profile
        </p>
        <h1 className="text-[40px] leading-[1.1] tracking-[-0.03em] text-[var(--text-primary)]">
          Settings
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Manage your business profile, account, and workspace preferences.
        </p>
      </header>

      {/* Appearance */}
      <section className="shopflow-glass rounded-3xl p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--accent-soft)] text-xl text-[var(--text-primary)]">
              {theme === "dark" ? "☾" : "☀"}
            </div>
            <div>
              <h2 className="font-semibold text-[var(--text-primary)]">
                Appearance
              </h2>
              <p className="text-sm text-[var(--text-secondary)]">
                Choose the look of your ShopFlow workspace.
              </p>
            </div>
          </div>

          <div
            className="flex w-full rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-1 sm:w-auto"
            aria-label="Theme preference"
          >
            <button
              type="button"
              aria-pressed={theme === "light"}
              onClick={() => setTheme("light")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition sm:flex-none ${
                theme === "light"
                  ? "bg-[var(--accent)] text-[var(--background)] shadow-sm"
                  : "text-[var(--text-secondary)] hover:bg-[var(--accent-soft)]"
              }`}
            >
              <span aria-hidden="true">☀</span>
              Light
            </button>
            <button
              type="button"
              aria-pressed={theme === "dark"}
              onClick={() => setTheme("dark")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition sm:flex-none ${
                theme === "dark"
                  ? "bg-[var(--accent)] text-[var(--background)] shadow-sm"
                  : "text-[var(--text-secondary)] hover:bg-[var(--accent-soft)]"
              }`}
            >
              <span aria-hidden="true">☾</span>
              Dark
            </button>
          </div>
        </div>
        <p className="mt-3 text-xs text-[var(--text-muted)]">
          Your preference is saved in this browser and restored when you return.
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Business */}
        <section className="shopflow-glass rounded-3xl p-6">
          <div className="flex items-center gap-3 border-b border-[var(--border)] pb-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-xl text-[var(--text-primary)]">
              🏢
            </div>
            <div>
              <h2 className="font-semibold text-[var(--text-primary)]">
                Business Workspace
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Organization details for this shop account
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-4 text-sm">
            <Detail label="Shop / Business Name" value={user.business.name} />
            <Detail label="Workspace ID" value={user.business.id} mono />
            <Detail
              label="Created On"
              value={new Date(user.business.createdAt).toLocaleDateString(
                "en-IN",
                { dateStyle: "long" },
              )}
            />
            <Detail label="Default Currency" value="₹ (Indian Rupee - INR)" />
            <Detail
              label="GSTIN"
              value={user.business.gstin || "Not registered (Unregistered Business)"}
              mono
            />
            <Detail
              label="State of Supply"
              value={user.business.businessState || "Not configured"}
            />

            {user.role === "OWNER" && (
              <div className="border-t border-[var(--border)] pt-3">
                {editingGst ? (
                  <form onSubmit={handleSaveGst} className="space-y-3">
                    <div>
                      <label
                        htmlFor="gstinInput"
                        className="mb-1 block text-xs font-medium text-[var(--text-secondary)]"
                      >
                        GSTIN (15 Characters)
                      </label>
                      <input
                        id="gstinInput"
                        type="text"
                        maxLength={15}
                        value={gstinInput}
                        onChange={(e) =>
                          setGstinInput(e.target.value.toUpperCase())
                        }
                        placeholder="e.g. 29AAAAA0000A1Z5"
                        className="w-full rounded-xl border border-[var(--border)] bg-white/60 px-3 py-2 font-mono text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="stateInput"
                        className="mb-1 block text-xs font-medium text-[var(--text-secondary)]"
                      >
                        Business State
                      </label>
                      <input
                        id="stateInput"
                        type="text"
                        value={businessStateInput}
                        onChange={(e) =>
                          setBusinessStateInput(e.target.value)
                        }
                        placeholder="e.g. Karnataka (29)"
                        className="w-full rounded-xl border border-[var(--border)] bg-white/60 px-3 py-2 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                      />
                    </div>
                    {gstError && (
                      <p className="text-xs font-semibold text-red-600">
                        {gstError}
                      </p>
                    )}
                    <div className="flex items-center gap-2">
                      <button
                        type="submit"
                        disabled={savingGst}
                        className="rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-medium text-white transition hover:bg-[var(--accent-hover)] disabled:opacity-50"
                      >
                        {savingGst ? "Saving..." : "Save GST Details"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingGst(false)}
                        className="rounded-full border border-[var(--border)] px-4 py-2 text-xs font-medium text-[var(--text-secondary)] hover:bg-black/5"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => setEditingGst(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--accent)] hover:underline rounded-full"
                  >
                    <span>✎</span> Edit GST Details
                  </button>
                )}
              </div>
            )}
          </div>
        </section>

        {/* User */}
        <section className="shopflow-glass rounded-3xl p-6">
          <div className="flex items-center gap-3 border-b border-[var(--border)] pb-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--text-primary)]">
              <PersonIcon />
            </div>
            <div>
              <h2 className="font-semibold text-[var(--text-primary)]">
                User Account
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Your authenticated user identity
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-4 text-sm">
            <Detail label="Full Name" value={user.name} />
            <Detail label="Email Address" value={user.email} mono />

            <div>
              <p className="text-xs font-medium text-[var(--text-muted)]">
                Role & Permissions
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-bold text-[var(--text-primary)]">
                  {user.role}
                </span>
                <span className="text-xs text-[var(--text-secondary)]">
                  {user.role === "OWNER"
                    ? "Business owner access"
                    : user.role === "MANAGER"
                      ? "Shop management access"
                      : "Staff access"}
                </span>
              </div>
            </div>

            <div className="border-t border-[var(--border)] pt-4">
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-4 py-2.5 text-sm font-medium text-[var(--danger)] transition hover:bg-[var(--danger)]/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span aria-hidden="true">↪</span>
                {loggingOut ? "Signing out..." : "Sign Out of ShopFlow"}
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Staff Management — only for OWNER */}
      {user.role === "OWNER" && <StaffPanel />}

      {/* System status */}
      <section className="shopflow-glass rounded-3xl p-6">
        <h2 className="font-semibold text-[var(--text-primary)]">
          System & Engine Health
        </h2>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Local runtime and database configuration
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <StatusCard label="Database" value="PostgreSQL (Connected)" dot="bg-emerald-500" />
          <StatusCard label="Framework" value="Next.js 16 (Turbopack)" dot="bg-blue-500" />
          <StatusCard label="Security" value="Tenant Isolated Sessions" dot="bg-violet-500" />
        </div>
      </section>
    </div>
  );
}

function Detail({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-[var(--text-muted)]">{label}</p>
      <p
        className={`mt-1 break-words font-semibold text-[var(--text-primary)] ${
          mono ? "font-mono text-xs" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function StatusCard({
  label,
  value,
  dot,
}: {
  label: string;
  value: string;
  dot: string;
}) {
  return (
    <div className="shopflow-glass-interactive rounded-3xl border border-[var(--border)] p-4">
      <span className="text-xs text-[var(--text-secondary)]">{label}</span>
      <div className="mt-2 flex items-start gap-2">
        <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${dot}`} />
        <p className="font-semibold text-[var(--text-primary)]">{value}</p>
      </div>
    </div>
  );
}

function PersonIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className="h-6 w-6"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
    </svg>
  );
}
