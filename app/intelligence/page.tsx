"use client";

import { useState } from "react";

export default function IntelligencePage() {
  const [query, setQuery] = useState("");

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">
            Intelligence
          </h1>

          <p className="mt-2 text-gray-400">
            Understand your business through search, insights,
            recommendations, and activity history.
          </p>
        </div>

        <section className="mb-6 rounded-lg border bg-white p-6 text-gray-900 shadow-sm">
          <h2 className="text-xl font-semibold">
            Smart Search
          </h2>

          <p className="mt-2 text-gray-600">
            Ask questions about your business data in natural
            language.
          </p>

          <div className="mt-5 flex flex-col gap-3 md:flex-row">
            <input
              type="text"
              value={query}
              onChange={(event) =>
                setQuery(event.target.value)
              }
              placeholder="e.g. Which products are low in stock?"
              className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-3 text-gray-900"
            />

            <button
              type="button"
              disabled={!query.trim()}
              className="rounded-md bg-black px-6 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Search
            </button>
          </div>

          <p className="mt-3 text-sm text-gray-500">
            Smart Search will be connected to business data in
            a later step.
          </p>
        </section>

        <div className="grid gap-6 md:grid-cols-3">
          <section className="rounded-lg border bg-white p-6 text-gray-900 shadow-sm">
            <h2 className="text-xl font-semibold">
              Insights
            </h2>

            <p className="mt-2 text-gray-600">
              Discover important patterns and changes in your
              business.
            </p>

            <p className="mt-4 text-sm text-gray-500">
              Coming soon
            </p>
          </section>

          <section className="rounded-lg border bg-white p-6 text-gray-900 shadow-sm">
            <h2 className="text-xl font-semibold">
              Recommendations
            </h2>

            <p className="mt-2 text-gray-600">
              Review business recommendations before taking
              action.
            </p>

            <p className="mt-4 text-sm text-gray-500">
              Coming soon
            </p>
          </section>

          <section className="rounded-lg border bg-white p-6 text-gray-900 shadow-sm">
            <h2 className="text-xl font-semibold">
              Business Timeline
            </h2>

            <p className="mt-2 text-gray-600">
              See important business events and changes in one
              place.
            </p>

            <p className="mt-4 text-sm text-gray-500">
              Coming soon
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}