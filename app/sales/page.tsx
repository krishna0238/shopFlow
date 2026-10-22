
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type PaymentMode = "CASH" | "UPI" | "CREDIT";

type Product = {
  id: string;
  name: string;
  sku: string | null;
  sellingPrice: string | number;
  stockQuantity: string | number;
  isActive: boolean;
};

type Customer = {
  id: string;
  name: string;
  phone: string | null;
};

type Sale = {
  id: string;
  totalAmount: string | number;
  paymentMode: PaymentMode;
  createdAt: string;
  customer: {
    id: string;
    name: string;
  } | null;
  items: {
    id: string;
    quantity: string | number;
    unitPrice: string | number;
    total: string | number;
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
  const router = useRouter();

  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  const [loading, setLoading] = useState(true);
  const [creatingSale, setCreatingSale] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [paymentMode, setPaymentMode] = useState<PaymentMode>("CASH");
  const [customerId, setCustomerId] = useState("");

  const [items, setItems] = useState<SaleItemForm[]>([
    { productId: "", quantity: "1", unitPrice: "0" },
  ]);

  // Barcode scanner state
  const [barcodeBuffer, setBarcodeBuffer] = useState("");
  const [lastKeyTime, setLastKeyTime] = useState(0);
  const [scanFlash, setScanFlash] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [salesResponse, productsResponse, customersResponse] =
        await Promise.all([
          fetch("/api/sales"),
          fetch("/api/products"),
          fetch("/api/customers"),
        ]);

      if (
        salesResponse.status === 401 ||
        productsResponse.status === 401 ||
        customersResponse.status === 401
      ) {
        router.replace("/login");
        return;
      }

      const [salesData, productsData, customersData] = await Promise.all([
        salesResponse.json(),
        productsResponse.json(),
        customersResponse.json(),
      ]);

      if (!salesResponse.ok) {
        throw new Error(salesData.error || "Failed to load sales");
      }

      if (!productsResponse.ok) {
        throw new Error(productsData.error || "Failed to load products");
      }

      if (!customersResponse.ok) {
        throw new Error(customersData.error || "Failed to load customers");
      }

      setSales(salesData.sales);
      setProducts(
        productsData.products.filter((product: Product) => product.isActive)
      );
      setCustomers(customersData.customers);
    } catch (err) {
      console.error("Sales page loading failed:", err);
      setError(
        err instanceof Error ? err.message : "Unable to load sales data."
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    let cancelled = false;

    Promise.resolve().then(() => {
      if (!cancelled) {
        void loadData();
      }
    });

    return () => {
      cancelled = true;
    };
  }, [loadData]);

  const handleBarcodeScan = useCallback(
    (sku: string) => {
      const product = products.find(
        (p) => p.sku && p.sku.toLowerCase() === sku.toLowerCase()
      );

      if (!product) {
        setScanFlash({
          message: `No product found for barcode: ${sku}`,
          type: "error",
        });
        setTimeout(() => setScanFlash(null), 3000);
        return;
      }

      if (Number(product.stockQuantity) <= 0) {
        setScanFlash({
          message: `${product.name} is out of stock`,
          type: "error",
        });
        setTimeout(() => setScanFlash(null), 3000);
        return;
      }

      // Check if product already in cart — if so increment quantity
      setItems((currentItems) => {
        const existingIdx = currentItems.findIndex(
          (item) => item.productId === product.id
        );
        if (existingIdx >= 0) {
          return currentItems.map((item, idx) =>
            idx === existingIdx
              ? { ...item, quantity: String(Number(item.quantity) + 1) }
              : item
          );
        }
        // Add new line
        const newItems = currentItems.filter((item) => item.productId !== "");
        return [
          ...newItems,
          {
            productId: product.id,
            quantity: "1",
            unitPrice: String(Number(product.sellingPrice)),
          },
        ];
      });

      setScanFlash({ message: `Added: ${product.name}`, type: "success" });
      setTimeout(() => setScanFlash(null), 2000);
    },
    [products]
  );

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ignore if a form input has focus (avoid interference)
      const target = e.target as HTMLElement;
      const isInput = target.tagName === "INPUT" || target.tagName === "SELECT" || target.tagName === "TEXTAREA";
      if (isInput) return;

      const now = Date.now();
      const timeDiff = now - lastKeyTime;
      setLastKeyTime(now);

      if (e.key === "Enter") {
        if (barcodeBuffer.length >= 3) {
          handleBarcodeScan(barcodeBuffer);
        }
        setBarcodeBuffer("");
        return;
      }

      // If time between keystrokes > 100ms, reset buffer (human typing)
      if (timeDiff > 100 && barcodeBuffer.length > 0) {
        setBarcodeBuffer(e.key);
      } else {
        setBarcodeBuffer((prev) => prev + e.key);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [barcodeBuffer, lastKeyTime, products]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleProductChange(index: number, productId: string) {
    const product = products.find((item) => item.id === productId);

    setFormError(null);

    setItems((currentItems) =>
      currentItems.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              productId,
              unitPrice: product ? String(Number(product.sellingPrice)) : "0",
            }
          : item
      )
    );
  }

  function handleQuantityChange(index: number, quantity: string) {
    setFormError(null);

    setItems((currentItems) =>
      currentItems.map((item, itemIndex) =>
        itemIndex === index ? { ...item, quantity } : item
      )
    );
  }

  function addItem() {
    setFormError(null);
    setItems((currentItems) => [
      ...currentItems,
      { productId: "", quantity: "1", unitPrice: "0" },
    ]);
  }

  function removeItem(index: number) {
    setFormError(null);
    setItems((currentItems) =>
      currentItems.filter((_, itemIndex) => itemIndex !== index)
    );
  }

  function calculateTotal() {
    return items.reduce(
      (total, item) =>
        total + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
      0
    );
  }

  const totalSalesAmount = sales.reduce(
    (total, sale) => total + Number(sale.totalAmount),
    0
  );

  const cashSalesAmount = sales
    .filter((sale) => sale.paymentMode === "CASH")
    .reduce((total, sale) => total + Number(sale.totalAmount), 0);

  const upiSalesAmount = sales
    .filter((sale) => sale.paymentMode === "UPI")
    .reduce((total, sale) => total + Number(sale.totalAmount), 0);

  const creditSalesAmount = sales
    .filter((sale) => sale.paymentMode === "CREDIT")
    .reduce((total, sale) => total + Number(sale.totalAmount), 0);

  async function handleCreateSale(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    if (items.length === 0) {
      setFormError("Add at least one product.");
      return;
    }

    if (paymentMode === "CREDIT" && !customerId) {
      setFormError("Select a customer for a credit sale.");
      return;
    }

    const hasInvalidItem = items.some(
      (item) =>
        !item.productId ||
        !Number.isFinite(Number(item.quantity)) ||
        Number(item.quantity) <= 0 ||
        !Number.isInteger(Number(item.quantity))
    );

    if (hasInvalidItem) {
      setFormError(
        "Select a product and enter a valid whole-number quantity for every item."
      );
      return;
    }

    const hasInsufficientStock = items.some((item) => {
      const product = products.find((candidate) => candidate.id === item.productId);

      return (
        !product ||
        Number(item.quantity) > Number(product.stockQuantity)
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
      const response = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: customerId || undefined,
          paymentMode,
          items: items.map((item) => ({
            productId: item.productId,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
          })),
        }),
      });

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create sale");
      }

           setSuccessMessage("Sale created successfully.");
      setPaymentMode("CASH");
      setCustomerId("");
      setItems([{ productId: "", quantity: "1", unitPrice: "0" }]);

      try {
        await loadData();
      } catch (refreshError) {
        console.error("Sale created, but refreshing sales data failed:", refreshError);
        setError("Sale was created, but the displayed data could not be refreshed. Reload the page to see the latest data.");
      }
    } catch (err) {
      console.error("Sale creation failed:", err);
      setFormError(
        err instanceof Error ? err.message : "Failed to create sale."
      );
    } finally {
      setCreatingSale(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen p-6">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-[40px] leading-[1.1] tracking-[-0.03em]">Sales</h1>
          <p className="mt-4 text-gray-500">Loading sales...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen p-6">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-[40px] leading-[1.1] tracking-[-0.03em]">Sales</h1>
          <p className="mt-4 text-red-600">{error}</p>
          <button
            type="button"
            onClick={() => void loadData()}
            className="mt-4 rounded-full border px-4 py-2 font-medium"
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-[40px] leading-[1.1] tracking-[-0.03em]">Sales</h1>
          <p className="mt-2 text-gray-500">
            Record and review sales transactions.
          </p>
        </div>

        <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { label: "Total Sales", value: String(sales.length) },
            { label: "Total Amount", value: `₹${totalSalesAmount.toFixed(2)}` },
            { label: "Cash", value: `₹${cashSalesAmount.toFixed(2)}` },
            { label: "UPI", value: `₹${upiSalesAmount.toFixed(2)}` },
            { label: "Credit", value: `₹${creditSalesAmount.toFixed(2)}` },
          ].map((summary) => (
            <div
              key={summary.label}
              className="rounded-3xl border bg-white p-5 text-gray-900"
            >
              <p className="text-sm text-gray-500">{summary.label}</p>
              <p className="mt-2 text-2xl font-bold">{summary.value}</p>
            </div>
          ))}
        </section>

        <section className="mb-8 rounded-3xl border bg-white p-6 text-gray-900">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold">Create sale</h2>
            <p className="mt-1 text-sm text-gray-600">
              Select products, choose the payment mode, optionally associate a
              customer, and record the sale.
            </p>
          </div>
          {/* Barcode Scanner Flash */}
          {scanFlash && (
            <div
              className={`mb-4 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold ${
                scanFlash.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-red-200 bg-red-50 text-red-800"
              }`}
            >
              <span>{scanFlash.type === "success" ? "✅" : "❌"}</span>
              {scanFlash.message}
            </div>
          )}

          {/* Scanner Status Indicator */}
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-2.5 text-xs text-emerald-900">
            <span>📷</span>
            <span className="font-semibold">Barcode Scanner Active</span>
            <span className="text-emerald-700">
              — Point and scan any product barcode to auto-add item to cart
            </span>
          </div>

          {formError && (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {formError}
            </div>
          )}

          {successMessage && (
            <div className="mb-4 rounded-2xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleCreateSale}>
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
                    setPaymentMode(event.target.value as PaymentMode);
                    setFormError(null);
                  }}
                  className="w-full rounded-xl border px-3 py-2"
                >
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="CREDIT">Credit</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="customer"
                  className="mb-2 block text-sm font-medium"
                >
                  Customer
                  {paymentMode === "CREDIT" && (
                    <span className="ml-1 text-red-600">*</span>
                  )}
                </label>
                <select
                  id="customer"
                  value={customerId}
                  onChange={(event) => {
                    setCustomerId(event.target.value);
                    setFormError(null);
                  }}
                  className="w-full rounded-xl border px-3 py-2"
                >
                  <option value="">Walk-in customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                      {customer.phone ? ` — ${customer.phone}` : ""}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  {paymentMode === "CREDIT"
                    ? "Customer is required for credit sales."
                    : "Optional for cash and UPI sales."}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {items.map((item, index) => {
                const selectedProduct = products.find(
                  (product) => product.id === item.productId
                );
                const requestedQuantity = Number(item.quantity) || 0;
                const availableStock = selectedProduct
                  ? Number(selectedProduct.stockQuantity)
                  : 0;
                const exceedsStock =
                  Boolean(selectedProduct) &&
                  requestedQuantity > availableStock;

                return (
                  <div key={index} className="rounded-lg border p-4">
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
                          value={item.productId}
                          onChange={(event) =>
                            handleProductChange(index, event.target.value)
                          }
                          className="w-full rounded-xl border px-3 py-2"
                        >
                          <option value="">Select product</option>
                          {products.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name} — ₹{Number(product.sellingPrice).toFixed(2)}
                            </option>
                          ))}
                        </select>
                        {selectedProduct && (
                          <p
                            className={`mt-1 text-xs ${
                              exceedsStock
                                ? "font-medium text-red-600"
                                : "text-gray-500"
                            }`}
                          >
                            Available stock: {selectedProduct.stockQuantity}
                            {exceedsStock && " — insufficient stock"}
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
                          value={item.quantity}
                          onChange={(event) =>
                            handleQuantityChange(index, event.target.value)
                          }
                          className={`w-full rounded-xl border px-3 py-2 ${
                            exceedsStock ? "border-red-500 bg-red-50" : ""
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
                          value={item.unitPrice}
                          readOnly
                          className="w-full rounded-xl border bg-gray-100 px-3 py-2"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        disabled={items.length === 1}
                        className="rounded-full border px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={addItem}
                className="rounded-full border px-4 py-2 text-sm font-medium hover:bg-gray-50"
              >
                + Add product
              </button>
            </div>

            <div className="mt-6 flex flex-col gap-4 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-600">Sale total</p>
                <p className="text-2xl font-bold">
                  ₹{calculateTotal().toFixed(2)}
                </p>
              </div>

              <button
                type="submit"
                disabled={creatingSale}
                className="rounded-full bg-white px-6 py-3 font-medium text-black ring-1 ring-gray-300 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {creatingSale ? "Creating sale..." : "Create sale"}
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-3xl border bg-white p-6 text-gray-900">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold">Sales history</h2>
            <p className="mt-1 text-sm text-gray-600">
              {sales.length} sales recorded
            </p>
          </div>

          {sales.length === 0 ? (
            <p className="text-gray-600">No sales recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left">
                <thead>
                  <tr className="border-b text-sm text-gray-600">
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Customer</th>
                    <th className="px-4 py-3 font-medium">Items</th>
                    <th className="px-4 py-3 font-medium">Payment</th>
                    <th className="px-4 py-3 text-right font-medium">Total</th>
                    <th className="px-4 py-3 text-right font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((sale) => (
                    <tr key={sale.id} className="border-b last:border-b-0">
                      <td className="px-4 py-4 text-sm">
                        {new Date(sale.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-4">
                        {sale.customer?.name ?? "Walk-in customer"}
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          {sale.items.map((item) => (
                            <div key={item.id} className="text-sm">
                              {item.product.name} × {item.quantity}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium">
                          {sale.paymentMode}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right font-semibold">
                        ₹{Number(sale.totalAmount).toFixed(2)}
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
