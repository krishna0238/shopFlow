"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Sales", href: "/sales" },
  { name: "Inventory", href: "/inventory" },
  { name: "Purchases", href: "/purchases" },
  { name: "Customers", href: "/customers" },
  { name: "Suppliers", href: "/suppliers" },
  { name: "Intelligence", href: "/intelligence" },
  { name: "Settings", href: "/settings" },
];

export default function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <header className="shopflow-glass-strong sticky top-0 z-50 w-full rounded-none border-x-0 border-t-0">
      <div className="mx-auto flex min-h-[76px] max-w-[1600px] items-center gap-6 px-4 sm:px-6 lg:px-10">
        <Link
          href="/dashboard"
          className="flex shrink-0 items-center gap-3"
          aria-label="ShopFlow Dashboard"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)] text-lg font-bold text-white shadow-sm">
            S
          </span>
          <span className="text-lg font-bold tracking-tight text-[var(--text-primary)]">
            ShopFlow
          </span>
        </Link>

        <nav
          aria-label="Main navigation"
          className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto py-3 [scrollbar-width:thin]"
        >
          {navigation.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" &&
                pathname.startsWith(`${item.href}/`));

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`shrink-0 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm transition-all duration-200 sm:px-4 ${
                  isActive
                    ? "bg-[var(--nav-active)] font-semibold text-[var(--nav-active-text)] shadow-sm"
                    : "font-medium text-[var(--text-secondary)] hover:bg-[var(--accent-soft)] hover:text-[var(--text-primary)]"
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}