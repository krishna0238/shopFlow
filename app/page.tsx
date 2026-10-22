import Link from "next/link";

const pillars = [
  {
    title: "Built on your numbers",
    description:
      "Every sale, stock movement and supplier invoice lands in one ledger, so the figures you see are the figures that are true.",
  },
  {
    title: "Made for the counter",
    description:
      "Record a sale in seconds, take cash, UPI or credit, and let inventory update itself while the customer is still at the till.",
  },
  {
    title: "Clear by default",
    description:
      "Low stock, pending payables and customer dues surface on their own. No reports to build, nothing to hunt for.",
  },
];

const workspaces = [
  {
    title: "Sales & customers",
    description:
      "Track sales, customer records and outstanding credit in one place.",
    href: "/sales",
  },
  {
    title: "Inventory",
    description:
      "Monitor quantities, stock movements and the items that need attention.",
    href: "/inventory",
  },
  {
    title: "Purchases",
    description:
      "Organise suppliers, purchase orders and supplier invoices.",
    href: "/purchases",
  },
  {
    title: "Business intelligence",
    description:
      "Ask questions about your shop and get answers from your own data.",
    href: "/intelligence",
  },
];

const bars = [38, 52, 44, 68, 58, 82, 74];

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-[var(--text-primary)]">
      {/* Announcement */}
      <div className="border-b border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-center text-[14px] text-[var(--text-secondary)]">
        <Link href="/intelligence" className="sf-link">
          New in ShopFlow: ask questions about your business in plain language
          <span aria-hidden="true"> →</span>
        </Link>
      </div>

      {/* Nav */}
      <header className="mx-auto flex h-[76px] w-full max-w-[1200px] items-center justify-between px-6">
        <Link
          href="/"
          className="font-serif text-[28px] leading-none tracking-[-0.03em]"
        >
          ShopFlow
        </Link>

        <nav
          aria-label="Primary"
          className="hidden items-center gap-8 text-[16px] md:flex"
        >
          <Link href="/sales" className="hover:underline underline-offset-4">
            Sales
          </Link>
          <Link href="/inventory" className="hover:underline underline-offset-4">
            Inventory
          </Link>
          <Link href="/purchases" className="hover:underline underline-offset-4">
            Purchases
          </Link>
          <Link
            href="/intelligence"
            className="hover:underline underline-offset-4"
          >
            Intelligence
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/login" className="sf-btn sf-btn-ghost sf-btn-sm">
            Sign in
          </Link>
          <Link href="/register" className="sf-btn sf-btn-sm">
            Get started
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto w-full max-w-[1200px] px-6 pb-10 pt-16 text-center sm:pt-24">
        <h1 className="mx-auto max-w-[900px] text-[44px] leading-[1.08] tracking-[-0.045em] sm:text-[72px] lg:text-[90px] lg:tracking-[-0.05em]">
          For shops that run on <em className="italic">clarity</em>
        </h1>

        <p className="mx-auto mt-7 max-w-[560px] text-[18px] leading-[1.45] tracking-[-0.01em] text-[var(--text-secondary)] sm:text-[20px]">
          Sales, inventory, customers, suppliers and purchasing in one calm
          workspace. Spend less time searching and more time running your
          shop.
        </p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link href="/dashboard" className="sf-btn">
            Open dashboard
          </Link>
          <Link href="/inventory" className="sf-btn sf-btn-ghost">
            View inventory
          </Link>
        </div>
      </section>

      {/* Floating product artifacts */}
      <section
        aria-hidden="true"
        className="relative mx-auto mt-10 w-full max-w-[1000px] px-6 pb-8"
      >
        <div className="sf-artifact mx-auto p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[14px] text-[var(--text-secondary)]">
                Sales this week
              </p>
              <p className="mt-1 text-[32px] font-medium leading-none tracking-[-0.02em]">
                ₹1,84,260
              </p>
              <p className="mt-2 text-[14px] text-[var(--text-secondary)]">
                +12.4% vs last week
              </p>
            </div>
            <div className="flex gap-2 text-[14px]">
              <span className="rounded-full bg-[var(--surface-muted)] px-3 py-1">
                Week
              </span>
              <span className="rounded-full px-3 py-1 text-[var(--text-muted)]">
                Month
              </span>
            </div>
          </div>

          <div className="mt-8 flex h-40 items-end gap-3 sm:gap-5">
            {bars.map((height, index) => (
              <div
                key={index}
                className="flex-1 rounded-t-xl"
                style={{
                  height: `${height}%`,
                  background:
                    index === bars.length - 2
                      ? "var(--sienna)"
                      : "var(--surface-muted)",
                }}
              />
            ))}
          </div>
        </div>

        <div className="sf-artifact mx-auto -mt-6 flex max-w-[640px] items-center gap-3 p-3 pl-5 sm:ml-auto sm:mr-6 sm:-mt-10">
          <span className="flex-1 text-[16px] text-[var(--text-muted)]">
            Which products are running low this week?
          </span>
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--on-accent)]">
            ↑
          </span>
        </div>
      </section>

      {/* Pillars */}
      <section className="mx-auto w-full max-w-[1200px] px-6 py-20 sm:py-[120px]">
        <h2 className="mx-auto max-w-[760px] text-center text-[36px] leading-[1.2] tracking-[-0.03em] sm:text-[44px]">
          A calmer way to run a shop
        </h2>

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {pillars.map((pillar) => (
            <div key={pillar.title} className="sf-card">
              <h3 className="text-[22px] font-medium leading-[1.25] tracking-[-0.02em]">
                {pillar.title}
              </h3>
              <p className="mt-3 text-[17px] leading-[1.45] text-[var(--text-secondary)]">
                {pillar.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Workspaces */}
      <section className="border-t border-[var(--border)] bg-[var(--background)]">
        <div className="mx-auto w-full max-w-[1200px] px-6 py-20 sm:py-[120px]">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
            <div>
              <p className="sf-eyebrow">One connected workspace</p>
              <h2 className="mt-4 text-[36px] leading-[1.2] tracking-[-0.03em] sm:text-[44px]">
                Everything a shop needs, together.
              </h2>
              <p className="mt-5 max-w-[420px] text-[17px] leading-[1.45] text-[var(--text-secondary)]">
                ShopFlow is built around the everyday work of small shops,
                with a foundation for more helpful insight over time.
              </p>
              <div className="mt-8">
                <Link href="/register" className="sf-btn">
                  Create your workspace
                </Link>
              </div>
            </div>

            <div className="divide-y divide-[var(--border)] border-y border-[var(--border)]">
              {workspaces.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex items-center justify-between gap-6 py-6"
                >
                  <div>
                    <h3 className="text-[22px] font-medium tracking-[-0.02em]">
                      {item.title}
                    </h3>
                    <p className="mt-1.5 max-w-[460px] text-[16px] leading-[1.45] text-[var(--text-secondary)]">
                      {item.description}
                    </p>
                  </div>
                  <span
                    aria-hidden="true"
                    className="text-[22px] transition-transform group-hover:translate-x-1"
                  >
                    →
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Closing CTA — the one peach card on the page */}
      <section className="mx-auto w-full max-w-[1200px] px-6 py-20 sm:py-[120px]">
        <div className="sf-card-peach px-6 py-16 text-center sm:px-16 sm:py-24">
          <h2 className="mx-auto max-w-[680px] text-[36px] leading-[1.15] tracking-[-0.03em] text-[var(--sienna)] sm:text-[56px]">
            Get started for free
          </h2>
          <p className="mx-auto mt-5 max-w-[480px] text-[18px] leading-[1.4]">
            Set up your shop in minutes and see your whole business at a
            glance.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/register" className="sf-btn">
              Create account
            </Link>
            <Link href="/login" className="sf-btn sf-btn-ghost">
              Sign in
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-[var(--border)]">
        <div className="mx-auto flex w-full max-w-[1200px] flex-wrap items-center justify-between gap-4 px-6 py-8 text-[14px] text-[var(--text-secondary)]">
          <span className="font-serif text-[22px] tracking-[-0.03em] text-[var(--text-primary)]">
            ShopFlow
          </span>
          <span>A simpler way to manage your shop.</span>
        </div>
      </footer>
    </div>
  );
}
