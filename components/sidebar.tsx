"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Sales", href: "/sales" },
  { label: "Inventory", href: "/inventory" },
  { label: "Purchases", href: "/purchases" },
  { label: "Customers", href: "/customers" },
  { label: "Suppliers", href: "/suppliers" },
  { label: "Intelligence", href: "/intelligence" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main navigation"
      className="mx-auto w-full min-w-0 max-w-[1280px] overflow-x-auto [scrollbar-width:none]"
    >
      <div className="flex min-h-[68px] w-full min-w-max items-center gap-2 px-4 sm:px-6 xl:px-8">
        <Link
          href="/dashboard"
          aria-label="ShopFlow dashboard"
          className="mr-6 shrink-0 font-serif text-[26px] leading-none tracking-[-0.03em] text-[var(--text-primary)]"
        >
          ShopFlow
        </Link>

        <div className="flex shrink-0 items-center gap-1">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href ||
              pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-[15px] transition-colors ${
                  isActive
                    ? "bg-[var(--nav-active)] font-medium text-[var(--nav-active-text)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--accent-soft)] hover:text-[var(--text-primary)]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2 pl-4">
          <Link
            href="/inventory"
            aria-label="Check inventory notifications"
            title="Check inventory"
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] text-[var(--text-secondary)] transition hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
          >
            <BellIcon />
          </Link>

          <Link
            href="/settings"
            aria-label="Open profile and settings"
            title="Profile & Settings"
            aria-current={pathname === "/settings" ? "page" : undefined}
            className={`flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border transition ${
              pathname === "/settings"
                ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--on-accent)]"
                : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
            }`}
          >
            <PersonIcon />
          </Link>
        </div>
      </div>
    </nav>
  );
}

function BellIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className="h-[18px] w-[18px]"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
    </svg>
  );
}
