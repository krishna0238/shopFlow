"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/sidebar";

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isPublicPage =
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/register";

  if (isPublicPage) {
    return <main className="w-full">{children}</main>;
  }

  return (
    <div className="flex min-h-screen min-w-0 flex-col bg-[var(--background)]">
      {/* Top navigation */}
      <header className="sticky top-0 z-50 w-full min-w-0 border-b border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur-md">
        <Sidebar />
      </header>

      {/* Main page content */}
      <main className="sf-shell-main w-full min-w-0 flex-1 px-4 pb-20 pt-8 sm:px-6 sm:pt-10 xl:px-8">
        <div className="mx-auto w-full min-w-0 max-w-[1280px]">
          {children}
        </div>
      </main>
    </div>
  );
}
