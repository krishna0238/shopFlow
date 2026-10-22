"use client";

import { useCallback, useEffect, useState } from "react";

type StaffMember = {
  id: string;
  name: string;
  email: string;
  role: "OWNER" | "MANAGER" | "STAFF";
  createdAt: string;
};

export function StaffPanel() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"MANAGER" | "STAFF">("STAFF");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const loadStaff = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/settings/staff");
      if (!res.ok) return;
      const data = (await res.json()) as { staff: StaffMember[] };
      setStaff(data.staff);
    } catch (err) {
      console.error("Failed to load staff", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) {
        void loadStaff();
      }
    });
    return () => {
      cancelled = true;
    };
  }, [loadStaff]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setSuccessMsg("");
    setSaving(true);
    try {
      const res = await fetch("/api/settings/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, role, password }),
      });
      const data = (await res.json()) as {
        user?: StaffMember;
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to add staff member");
      }
      setSuccessMsg(
        `${data.user?.name ?? "Staff member"} added successfully!`
      );
      setName("");
      setEmail("");
      setPassword("");
      setRole("STAFF");
      setShowForm(false);
      await loadStaff();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Failed to add staff member"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="shopflow-glass rounded-3xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-xl">
            👥
          </span>
          <div>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              Staff & Team Access
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Manage operators and managers for your shop
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowForm(!showForm);
            setFormError("");
            setSuccessMsg("");
          }}
          className="rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-medium text-white transition hover:bg-[var(--accent-hover)]"
        >
          {showForm ? "Cancel" : "+ Add Team Member"}
        </button>
      </div>

      {successMsg && (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-800">
          ✅ {successMsg}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleInvite} className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="staffName"
              className="mb-1 block text-xs font-medium text-[var(--text-secondary)]"
            >
              Full Name *
            </label>
            <input
              id="staffName"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-white/50 px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
              placeholder="e.g. Rahul Sharma"
            />
          </div>

          <div>
            <label
              htmlFor="staffEmail"
              className="mb-1 block text-xs font-medium text-[var(--text-secondary)]"
            >
              Email Address *
            </label>
            <input
              id="staffEmail"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-white/50 px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
              placeholder="rahul@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="staffRole"
              className="mb-1 block text-xs font-medium text-[var(--text-secondary)]"
            >
              Role & Permissions
            </label>
            <select
              id="staffRole"
              value={role}
              onChange={(e) =>
                setRole(e.target.value as "MANAGER" | "STAFF")
              }
              className="w-full rounded-xl border border-[var(--border)] bg-white/50 px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
            >
              <option value="STAFF">Staff (POS / Sales Counter)</option>
              <option value="MANAGER">Manager (Purchases, Inventory & Reports)</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="staffPassword"
              className="mb-1 block text-xs font-medium text-[var(--text-secondary)]"
            >
              Initial Password *
            </label>
            <input
              id="staffPassword"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-white/50 px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
              placeholder="Minimum 6 characters"
            />
          </div>

          {formError && (
            <p className="col-span-full text-xs font-semibold text-red-600">
              {formError}
            </p>
          )}

          <div className="col-span-full pt-1">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-xs font-medium text-white transition hover:bg-[var(--accent-hover)] disabled:opacity-50"
            >
              {saving ? "Creating Account..." : "Create Staff Account"}
            </button>
          </div>
        </form>
      )}

      <div className="mt-5 overflow-x-auto">
        {loading ? (
          <div className="h-16 animate-pulse rounded-xl bg-black/5" />
        ) : staff.length === 0 ? (
          <p className="text-xs text-[var(--text-secondary)]">
            No team members added yet. Invite cashiers and store managers to access this shop.
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                <th className="py-2.5">Name</th>
                <th className="py-2.5">Email</th>
                <th className="py-2.5">Role</th>
                <th className="py-2.5 text-right">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {staff.map((s) => (
                <tr key={s.id} className="text-xs text-[var(--text-primary)]">
                  <td className="py-3 font-semibold">{s.name}</td>
                  <td className="py-3 font-mono text-[var(--text-secondary)]">
                    {s.email}
                  </td>
                  <td className="py-3">
                    <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-[var(--accent)]">
                      {s.role}
                    </span>
                  </td>
                  <td className="py-3 text-right text-[var(--text-muted)]">
                    {new Date(s.createdAt).toLocaleDateString("en-IN", {
                      dateStyle: "medium",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
