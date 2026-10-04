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

export default function MainNavigation() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 items-center gap-5 overflow-x-auto">
      {navigation.map((item) => {
        const isActive =
          pathname === item.href ||
          pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`relative whitespace-nowrap py-4 text-sm transition ${
              isActive
                ? "font-bold text-white after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-white"
                : "font-normal text-gray-400 hover:text-white"
            }`}
          >
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
}