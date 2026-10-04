import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import MainNavigation from "@/components/main-navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ShopFlow",
  description:
    "The simple business operating system for small shops.",
};

export default function RootLayout({
  children,
}: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        <header className="border-b border-[var(--glass-border-subtle)] bg-[var(--glass-soft)] backdrop-blur-xl">
          <div className="flex w-full items-center gap-8 px-5 py-4 sm:px-7 lg:px-10 xl:px-12 2xl:px-14">
            <Link
              href="/dashboard"
              className="shrink-0 text-xl font-bold text-[var(--text-primary)]"
            >
              ShopFlow
            </Link>

            <MainNavigation />
          </div>
        </header>

        <main className="w-full">{children}</main>
      </body>
    </html>
  );
}