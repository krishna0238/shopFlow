"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

const BUSINESS_ID = "3b4fc147-7ea2-495f-a64e-878dfdabc158";

type Category = {
  id: string;
  businessId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

type Product = {
  id: string;
  name: string;
  sku: string | null;
  purchasePrice: string | number;
  sellingPrice: string | number;
  stockQuantity: string | number;
  lowStockThreshold: string | number;
  category: Category | null;
};

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const [error, setError] = useState("");
  const [categoryError, setCategoryError] = useState("");

  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");
  const [lowStockThreshold, setLowStockThreshold] = useState("");

  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  async function loadProducts() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/products?businessId=${BUSINESS_ID}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load products");
      }

      setProducts(data.products);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load products"
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadCategories() {
    try {
      setCategoriesLoading(true);
      setCategoryError("");

      const response = await fetch(
        `/api/categories?businessId=${BUSINESS_ID}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to load categories"
        );
      }

      setCategories(
        Array.isArray(data)
          ? data
          : data.categories ?? []
      );
    } catch (err) {
      setCategoryError(
        err instanceof Error
          ? err.message
          : "Failed to load categories"
      );
    } finally {
      setCategoriesLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  async function handleCreateProduct(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    try {
      setCreating(true);
      setCreateError("");

      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessId: BUSINESS_ID,
          name,
          sku: sku || undefined,
          categoryId: categoryId || undefined,
          purchasePrice: Number(purchasePrice),
          sellingPrice: Number(sellingPrice),
          stockQuantity: Number(stockQuantity || 0),
          lowStockThreshold: Number(
            lowStockThreshold || 0
          ),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to create product"
        );
      }

      setName("");
      setSku("");
      setCategoryId("");
      setPurchasePrice("");
      setSellingPrice("");
      setStockQuantity("");
      setLowStockThreshold("");

      await loadProducts();
    } catch (err) {
      setCreateError(
        err instanceof Error
          ? err.message
          : "Failed to create product"
      );
    } finally {
      setCreating(false);
    }
  }

  function getStockStatus(product: Product) {
    const stock = Number(product.stockQuantity);
    const threshold = Number(product.lowStockThreshold);

    if (stock <= threshold) {
      return "Low stock";
    }

    return "In stock";
  }

  return (
    <main className="min-h-screen p-6 text-gray-900">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">
            Inventory
          </h1>

          <p className="mt-2 text-gray-400">
            Manage products, stock levels, and inventory history.
          </p>
        </div>

        <section className="mb-8 rounded-lg border bg-white p-6 text-gray-900 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            Create Product
          </h2>

          <form
            onSubmit={handleCreateProduct}
            className="grid gap-4 md:grid-cols-2"
          >
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-900">
                Product name
              </label>

              <input
                type="text"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                required
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400"
                placeholder="Example: USB Cable"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-900">
                SKU
              </label>

              <input
                type="text"
                value={sku}
                onChange={(event) =>
                  setSku(event.target.value)
                }
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400"
                placeholder="Optional"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-900">
                Category
              </label>

              <select
                value={categoryId}
                onChange={(event) =>
                  setCategoryId(event.target.value)
                }
                disabled={
                  categoriesLoading || creating
                }
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900"
              >
                <option value="">
                  {categoriesLoading
                    ? "Loading categories..."
                    : "No category"}
                </option>

                {categories.map((category) => (
                  <option
                    key={category.id}
                    value={category.id}
                  >
                    {category.name}
                  </option>
                ))}
              </select>

              {categoryError && (
                <p className="mt-1 text-sm text-red-600">
                  {categoryError}
                </p>
              )}

              {!categoriesLoading &&
                !categoryError &&
                categories.length === 0 && (
                  <p className="mt-1 text-sm text-gray-500">
                    No categories available. You can create
                    one from the Categories page.
                  </p>
                )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-900">
                Purchase price
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={purchasePrice}
                onChange={(event) =>
                  setPurchasePrice(event.target.value)
                }
                required
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400"
                placeholder="0"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-900">
                Selling price
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={sellingPrice}
                onChange={(event) =>
                  setSellingPrice(event.target.value)
                }
                required
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400"
                placeholder="0"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-900">
                Initial stock
              </label>

              <input
                type="number"
                min="0"
                step="1"
                value={stockQuantity}
                onChange={(event) =>
                  setStockQuantity(event.target.value)
                }
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400"
                placeholder="0"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-900">
                Low-stock threshold
              </label>

              <input
                type="number"
                min="0"
                step="1"
                value={lowStockThreshold}
                onChange={(event) =>
                  setLowStockThreshold(event.target.value)
                }
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400"
                placeholder="0"
              />
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={creating}
                className="rounded-md bg-black px-5 py-2 font-medium text-white disabled:opacity-50"
              >
                {creating
                  ? "Creating..."
                  : "Create Product"}
              </button>
            </div>
          </form>

          {createError && (
            <p className="mt-4 text-sm text-red-600">
              {createError}
            </p>
          )}
        </section>

        <section className="rounded-lg border bg-white p-6 text-gray-900 shadow-sm">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Current Stock
            </h2>
          </div>

          {loading && (
            <p className="text-gray-600">
              Loading inventory...
            </p>
          )}

          {error && (
            <p className="text-red-600">
              {error}
            </p>
          )}

          {!loading &&
            !error &&
            products.length === 0 && (
              <p className="text-gray-600">
                No products found.
              </p>
            )}

          {!loading &&
            !error &&
            products.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 text-left">
                      <th className="px-4 py-3 font-semibold text-gray-900">
                        Product
                      </th>

                      <th className="px-4 py-3 font-semibold text-gray-900">
                        Category
                      </th>

                      <th className="px-4 py-3 font-semibold text-gray-900">
                        SKU
                      </th>

                      <th className="px-4 py-3 font-semibold text-gray-900">
                        Current stock
                      </th>

                      <th className="px-4 py-3 font-semibold text-gray-900">
                        Low-stock threshold
                      </th>

                      <th className="px-4 py-3 font-semibold text-gray-900">
                        Selling price
                      </th>

                      <th className="px-4 py-3 font-semibold text-gray-900">
                        Status
                      </th>

                      <th className="px-4 py-3 font-semibold text-gray-900">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {products.map((product) => {
                      const status =
                        getStockStatus(product);

                      return (
                        <tr
                          key={product.id}
                          className="border-b border-gray-200 last:border-0"
                        >
                          <td className="px-4 py-3 text-gray-900">
                            {product.name}
                          </td>

                          <td className="px-4 py-3 text-gray-700">
                            {product.category?.name || "—"}
                          </td>

                          <td className="px-4 py-3 text-gray-700">
                            {product.sku || "—"}
                          </td>

                          <td className="px-4 py-3 text-gray-900">
                            {product.stockQuantity}
                          </td>

                          <td className="px-4 py-3 text-gray-900">
                            {product.lowStockThreshold}
                          </td>

                          <td className="px-4 py-3 text-gray-900">
                            ₹
                            {Number(
                              product.sellingPrice
                            ).toFixed(2)}
                          </td>

                          <td className="px-4 py-3">
                            <span
                              className={
                                status === "Low stock"
                                  ? "font-medium text-red-600"
                                  : "font-medium text-green-600"
                              }
                            >
                              {status}
                            </span>
                          </td>

                          <td className="px-4 py-3">
                            <Link
                              href={`/inventory/${product.id}`}
                              className="font-medium text-gray-900 underline underline-offset-4 hover:text-gray-600"
                            >
                              View Product
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
        </section>
      </div>
    </main>
  );
}