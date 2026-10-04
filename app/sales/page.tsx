"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const BUSINESS_ID =
  "3b4fc147-7ea2-495f-a64e-878dfdabc158";

type Product = {
  id: string;
  name: string;
  sku: string | null;
  sellingPrice: string;
  stockQuantity: string;
  isActive: boolean;
};

type Customer = {
  id: string;
  name: string;
  phone: string | null;
};

type Sale = {
  id: string;
  totalAmount: string;
  paymentMode: "CASH" | "UPI" | "CREDIT";
  createdAt: string;
  customer: {
    id: string;
    name: string;
  } | null;
  items: {
    id: string;
    quantity: string;
    unitPrice: string;
    total: string;
    product: {
      id: string;
      name: string;
      sku: string | null;
    };
  }[];
};

type SaleItemForm = {
  productId: string;
  quantity: string;
  unitPrice: string;
};

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  const [loading, setLoading] = useState(true);
  const [creatingSale, setCreatingSale] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] =
    useState<string | null>(null);
  const [successMessage, setSuccessMessage] =
    useState<string | null>(null);

  const [paymentMode, setPaymentMode] =
    useState<"CASH" | "UPI" | "CREDIT">("CASH");

  const [customerId, setCustomerId] = useState("");

  const [items, setItems] = useState<SaleItemForm[]>([
    {
      productId: "",
      quantity: "1",
      unitPrice: "0",
    },
  ]);

  useEffect(() => {
    async function loadData() {
      try {
        const [
          salesResponse,
          productsResponse,
          customersResponse,
        ] = await Promise.all([
          fetch(
            `/api/sales?businessId=${BUSINESS_ID}`
          ),
          fetch(
            `/api/products?businessId=${BUSINESS_ID}`
          ),
          fetch(
            `/api/customers?businessId=${BUSINESS_ID}`
          ),
        ]);

        if (!salesResponse.ok) {
          throw new Error("Failed to load sales");
        }

        if (!productsResponse.ok) {
          throw new Error("Failed to load products");
        }

        if (!customersResponse.ok) {
          throw new Error("Failed to load customers");
        }

        const salesData =
          await salesResponse.json();

        const productsData =
          await productsResponse.json();

        const customersData =
          await customersResponse.json();

        setSales(salesData.sales);

        setProducts(
          productsData.products.filter(
            (product: Product) => product.isActive
          )
        );

        setCustomers(customersData.customers);
      } catch (error) {
        console.error(
          "Sales page loading failed:",
          error
        );

        setError("Unable to load sales data.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  function handleProductChange(
    index: number,
    productId: string
  ) {
    const product = products.find(
      (item) => item.id === productId
    );

    setFormError(null);

    setItems((currentItems) =>
      currentItems.map(
        (item, itemIndex) =>
          itemIndex === index
            ? {
                ...item,
                productId,
                unitPrice: product
                  ? String(product.sellingPrice)
                  : "0",
              }
            : item
      )
    );
  }

  function handleQuantityChange(
    index: number,
    quantity: string
  ) {
    setFormError(null);

    setItems((currentItems) =>
      currentItems.map(
        (item, itemIndex) =>
          itemIndex === index
            ? {
                ...item,
                quantity,
              }
            : item
      )
    );
  }

  function addItem() {
    setFormError(null);

    setItems((currentItems) => [
      ...currentItems,
      {
        productId: "",
        quantity: "1",
        unitPrice: "0",
      },
    ]);
  }

  function removeItem(index: number) {
    setFormError(null);

    setItems((currentItems) =>
      currentItems.filter(
        (_, itemIndex) => itemIndex !== index
      )
    );
  }

  function calculateTotal() {
    return items.reduce((total, item) => {
      const quantity =
        Number(item.quantity) || 0;

      const unitPrice =
        Number(item.unitPrice) || 0;

      return total + quantity * unitPrice;
    }, 0);
  }

  const totalSalesAmount = sales.reduce(
    (total, sale) =>
      total + Number(sale.totalAmount),
    0
  );

  const cashSalesAmount = sales
    .filter(
      (sale) => sale.paymentMode === "CASH"
    )
    .reduce(
      (total, sale) =>
        total + Number(sale.totalAmount),
      0
    );

  const upiSalesAmount = sales
    .filter(
      (sale) => sale.paymentMode === "UPI"
    )
    .reduce(
      (total, sale) =>
        total + Number(sale.totalAmount),
      0
    );

  const creditSalesAmount = sales
    .filter(
      (sale) => sale.paymentMode === "CREDIT"
    )
    .reduce(
      (total, sale) =>
        total + Number(sale.totalAmount),
      0
    );

  async function handleCreateSale(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setFormError(null);
    setSuccessMessage(null);

    if (items.length === 0) {
      setFormError(
        "Add at least one product."
      );

      return;
    }

    if (
      paymentMode === "CREDIT" &&
      !customerId
    ) {
      setFormError(
        "Select a customer for a credit sale."
      );

      return;
    }

    const hasInvalidItem = items.some(
      (item) =>
        !item.productId ||
        Number(item.quantity) <= 0
    );

    if (hasInvalidItem) {
      setFormError(
        "Select a product and enter a valid quantity for every item."
      );

      return;
    }

    const hasInsufficientStock =
      items.some((item) => {
        const product = products.find(
          (product) =>
            product.id === item.productId
        );

        if (!product) {
          return true;
        }

        return (
          Number(item.quantity) >
          Number(product.stockQuantity)
        );
      });

    if (hasInsufficientStock) {
      setFormError(
        "One or more products do not have enough stock for this sale."
      );

      return;
    }

    setCreatingSale(true);

    try {
      const response = await fetch(
        "/api/sales",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            businessId: BUSINESS_ID,
            customerId: customerId || undefined,
            paymentMode,
            items: items.map((item) => ({
              productId:
                item.productId,
              quantity:
                Number(item.quantity),
              unitPrice:
                Number(item.unitPrice),
            })),
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ??
            "Failed to create sale"
        );
      }

      setSuccessMessage(
        "Sale created successfully."
      );

      setPaymentMode("CASH");
      setCustomerId("");

      setItems([
        {
          productId: "",
          quantity: "1",
          unitPrice: "0",
        },
      ]);

      const [
        salesResponse,
        productsResponse,
      ] = await Promise.all([
        fetch(
          `/api/sales?businessId=${BUSINESS_ID}`
        ),
        fetch(
          `/api/products?businessId=${BUSINESS_ID}`
        ),
      ]);

      if (salesResponse.ok) {
        const salesData =
          await salesResponse.json();

        setSales(
          salesData.sales
        );
      }

      if (productsResponse.ok) {
        const productsData =
          await productsResponse.json();

        setProducts(
          productsData.products.filter(
            (product: Product) =>
              product.isActive
          )
        );
      }
    } catch (error) {
      console.error(
        "Sale creation failed:",
        error
      );

      setFormError(
        error instanceof Error
          ? error.message
          : "Failed to create sale."
      );
    } finally {
      setCreatingSale(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen p-6">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-3xl font-bold">
            Sales
          </h1>

          <p className="mt-4 text-gray-500">
            Loading sales...
          </p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen p-6">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-3xl font-bold">
            Sales
          </h1>

          <p className="mt-4 text-red-600">
            {error}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            Sales
          </h1>

          <p className="mt-2 text-gray-500">
            Record and review sales
            transactions.
          </p>
        </div>

        <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-xl border bg-white p-5 text-gray-900 shadow-sm">
            <p className="text-sm text-gray-500">
              Total Sales
            </p>

            <p className="mt-2 text-2xl font-bold">
              {sales.length}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-5 text-gray-900 shadow-sm">
            <p className="text-sm text-gray-500">
              Total Amount
            </p>

            <p className="mt-2 text-2xl font-bold">
              ₹{totalSalesAmount.toFixed(2)}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-5 text-gray-900 shadow-sm">
            <p className="text-sm text-gray-500">
              Cash
            </p>

            <p className="mt-2 text-2xl font-bold">
              ₹{cashSalesAmount.toFixed(2)}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-5 text-gray-900 shadow-sm">
            <p className="text-sm text-gray-500">
              UPI
            </p>

            <p className="mt-2 text-2xl font-bold">
              ₹{upiSalesAmount.toFixed(2)}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-5 text-gray-900 shadow-sm">
            <p className="text-sm text-gray-500">
              Credit
            </p>

            <p className="mt-2 text-2xl font-bold">
              ₹{creditSalesAmount.toFixed(2)}
            </p>
          </div>
        </section>

        <section className="mb-8 rounded-xl border bg-white p-6 text-gray-900 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-semibold">
              Create sale
            </h2>

            <p className="mt-1 text-sm text-gray-600">
              Select products, choose the
              payment mode, optionally
              associate a customer, and
              record the sale.
            </p>
          </div>

          {formError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {formError}
            </div>
          )}

          {successMessage && (
            <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
              {successMessage}
            </div>
          )}

          <form
            onSubmit={handleCreateSale}
          >
            <div className="mb-6 grid gap-6 md:grid-cols-2">
              <div>
                <label
                  htmlFor="paymentMode"
                  className="mb-2 block text-sm font-medium"
                >
                  Payment mode
                </label>

                <select
                  id="paymentMode"
                  value={paymentMode}
                  onChange={(event) => {
                    setPaymentMode(
                      event.target
                        .value as
                        | "CASH"
                        | "UPI"
                        | "CREDIT"
                    );

                    setFormError(null);
                  }}
                  className="w-full rounded-lg border px-3 py-2"
                >
                  <option value="CASH">
                    Cash
                  </option>

                  <option value="UPI">
                    UPI
                  </option>

                  <option value="CREDIT">
                    Credit
                  </option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="customer"
                  className="mb-2 block text-sm font-medium"
                >
                  Customer
                  {paymentMode ===
                    "CREDIT" && (
                    <span className="ml-1 text-red-600">
                      *
                    </span>
                  )}
                </label>

                <select
                  id="customer"
                  value={customerId}
                  onChange={(event) => {
                    setCustomerId(
                      event.target.value
                    );

                    setFormError(null);
                  }}
                  className="w-full rounded-lg border px-3 py-2"
                >
                  <option value="">
                    Walk-in customer
                  </option>

                  {customers.map(
                    (customer) => (
                      <option
                        key={
                          customer.id
                        }
                        value={
                          customer.id
                        }
                      >
                        {customer.name}

                        {customer.phone
                          ? ` — ${customer.phone}`
                          : ""}
                      </option>
                    )
                  )}
                </select>

                <p className="mt-1 text-xs text-gray-500">
                  {paymentMode ===
                  "CREDIT"
                    ? "Customer is required for credit sales."
                    : "Optional for cash and UPI sales."}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {items.map(
                (item, index) => {
                  const selectedProduct =
                    products.find(
                      (product) =>
                        product.id ===
                        item.productId
                    );

                  const requestedQuantity =
                    Number(
                      item.quantity
                    ) || 0;

                  const availableStock =
                    selectedProduct
                      ? Number(
                          selectedProduct.stockQuantity
                        )
                      : 0;

                  const exceedsStock =
                    Boolean(
                      selectedProduct &&
                        requestedQuantity >
                          availableStock
                    );

                  return (
                    <div
                      key={index}
                      className="rounded-lg border p-4"
                    >
                      <div className="grid gap-4 md:grid-cols-[1fr_140px_140px_auto] md:items-end">
                        <div>
                          <label
                            htmlFor={`product-${index}`}
                            className="mb-2 block text-sm font-medium"
                          >
                            Product
                          </label>

                          <select
                            id={`product-${index}`}
                            value={
                              item.productId
                            }
                            onChange={(
                              event
                            ) =>
                              handleProductChange(
                                index,
                                event
                                  .target
                                  .value
                              )
                            }
                            className="w-full rounded-lg border px-3 py-2"
                          >
                            <option value="">
                              Select product
                            </option>

                            {products.map(
                              (
                                product
                              ) => (
                                <option
                                  key={
                                    product.id
                                  }
                                  value={
                                    product.id
                                  }
                                >
                                  {
                                    product.name
                                  }{" "}
                                  — ₹
                                  {
                                    product.sellingPrice
                                  }
                                </option>
                              )
                            )}
                          </select>

                          {selectedProduct && (
                            <p
                              className={`mt-1 text-xs ${
                                exceedsStock
                                  ? "font-medium text-red-600"
                                  : "text-gray-500"
                              }`}
                            >
                              Available
                              stock:{" "}
                              {
                                selectedProduct.stockQuantity
                              }

                              {exceedsStock &&
                                " — insufficient stock"}
                            </p>
                          )}
                        </div>

                        <div>
                          <label
                            htmlFor={`quantity-${index}`}
                            className="mb-2 block text-sm font-medium"
                          >
                            Quantity
                          </label>

                          <input
                            id={`quantity-${index}`}
                            type="number"
                            min="1"
                            step="1"
                            value={
                              item.quantity
                            }
                            onChange={(
                              event
                            ) =>
                              handleQuantityChange(
                                index,
                                event
                                  .target
                                  .value
                              )
                            }
                            className={`w-full rounded-lg border px-3 py-2 ${
                              exceedsStock
                                ? "border-red-500 bg-red-50"
                                : ""
                            }`}
                          />
                        </div>

                        <div>
                          <label
                            htmlFor={`price-${index}`}
                            className="mb-2 block text-sm font-medium"
                          >
                            Unit price
                          </label>

                          <input
                            id={`price-${index}`}
                            type="number"
                            min="0"
                            step="0.01"
                            value={
                              item.unitPrice
                            }
                            readOnly
                            className="w-full rounded-lg border bg-gray-100 px-3 py-2"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            removeItem(
                              index
                            )
                          }
                          disabled={
                            items.length ===
                            1
                          }
                          className="rounded-lg border px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                }
              )}
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={addItem}
                className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
              >
                + Add product
              </button>
            </div>

            <div className="mt-6 flex flex-col gap-4 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  Sale total
                </p>

                <p className="text-2xl font-bold">
                  ₹
                  {calculateTotal().toFixed(
                    2
                  )}
                </p>
              </div>

              <button
                type="submit"
                disabled={
                  creatingSale
                }
                className="rounded-lg bg-white px-6 py-3 font-semibold text-black ring-1 ring-gray-300 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {creatingSale
                  ? "Creating sale..."
                  : "Create sale"}
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-xl border bg-white p-6 text-gray-900 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-semibold">
              Sales history
            </h2>

            <p className="mt-1 text-sm text-gray-600">
              {sales.length} sales
              recorded
            </p>
          </div>

          {sales.length === 0 ? (
            <p className="text-gray-600">
              No sales recorded yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left">
                <thead>
                  <tr className="border-b text-sm text-gray-600">
                    <th className="px-4 py-3 font-medium">
                      Date
                    </th>

                    <th className="px-4 py-3 font-medium">
                      Customer
                    </th>

                    <th className="px-4 py-3 font-medium">
                      Items
                    </th>

                    <th className="px-4 py-3 font-medium">
                      Payment
                    </th>

                    <th className="px-4 py-3 text-right font-medium">
                      Total
                    </th>

                    <th className="px-4 py-3 text-right font-medium">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {sales.map((sale) => (
                    <tr
                      key={sale.id}
                      className="border-b last:border-b-0"
                    >
                      <td className="px-4 py-4 text-sm">
                        {new Date(
                          sale.createdAt
                        ).toLocaleString()}
                      </td>

                      <td className="px-4 py-4">
                        {sale.customer?.name ??
                          "Walk-in customer"}
                      </td>

                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          {sale.items.map(
                            (item) => (
                              <div
                                key={
                                  item.id
                                }
                                className="text-sm"
                              >
                                {
                                  item
                                    .product
                                    .name
                                }{" "}
                                ×{" "}
                                {
                                  item.quantity
                                }
                              </div>
                            )
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium">
                          {
                            sale.paymentMode
                          }
                        </span>
                      </td>

                      <td className="px-4 py-4 text-right font-semibold">
                        ₹
                        {
                          sale.totalAmount
                        }
                      </td>

                      <td className="px-4 py-4 text-right">
                        <Link
                          href={`/sales/${sale.id}`}
                          className="font-medium text-blue-600 underline underline-offset-4 hover:text-blue-800"
                        >
                          View Sale
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}