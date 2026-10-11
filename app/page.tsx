
const features = [
  {
    number: "01",
    title: "Sales & Customers",
    description:
      "Track sales, customer records, and outstanding credit in one place.",
    href: "/sales",
  },
  {
    number: "02",
    title: "Inventory",
    description:
      "Monitor product quantities, stock movements, and items needing attention.",
    href: "/inventory",
  },
  {
    number: "03",
    title: "Purchases",
    description:
      "Organize suppliers, purchase orders, and supplier invoices.",
    href: "/purchases",
  },
  {
    number: "04",
    title: "Business Intelligence",
    description:
      "Build toward smarter business search and invoice-assisted workflows.",
    href: "/intelligence",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="mx-auto max-w-6xl px-6 py-20 sm:px-10 lg:py-28">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">
            ShopFlow · Business OS for Small Shops
          </p>

          <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-6xl">
            Run your shop with
            <span className="block text-blue-700">
              clarity and confidence.
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            Bring sales, inventory, customers, suppliers, and purchasing
            workflows together in one place. Spend less time searching for
            business information and more time running your shop.
          </p>

          <div className="mt-9 flex flex-wrap gap-4">
            <a
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-lg bg-blue-700 px-6 py-3 font-semibold text-white transition hover:bg-blue-800"
            >
              Open Dashboard
            </a>

            <a
              href="/inventory"
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              View Inventory
            </a>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:px-10">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">
              One connected workspace
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight">
              The essentials of your business, together.
            </h2>

            <p className="mt-4 leading-7 text-slate-600">
              ShopFlow is being built around the everyday work of small
              shops, with a foundation for more helpful business insights
              over time.
            </p>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {features.map((feature) => (
              <a
                key={feature.number}
                href={feature.href}
                className="group rounded-2xl border border-slate-200 bg-slate-50 p-6 transition hover:border-blue-300 hover:bg-blue-50"
              >
                <p className="text-sm font-semibold text-blue-700">
                  {feature.number}
                </p>

                <h3 className="mt-3 text-xl font-bold">
                  {feature.title}
                </h3>

                <p className="mt-3 leading-7 text-slate-600">
                  {feature.description}
                </p>

                <span className="mt-5 inline-block font-semibold text-blue-700">
                  Explore section →
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 px-6 py-6 text-center text-sm text-slate-500">
        ShopFlow · A simpler way to manage your shop.
      </footer>
    </main>
  );
}
