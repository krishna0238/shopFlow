"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

const BUSINESS_ID =
  "3b4fc147-7ea2-495f-a64e-878dfdabc158";

type PurchaseOrderStatus =
  | "DRAFT"
  | "ORDERED"
  | "RECEIVED"
  | "CANCELLED";

type PurchaseOrder = {
  id: string;
  status: PurchaseOrderStatus;
  createdAt: string;
  supplier: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    address: string | null;
  };
};

type PurchaseItem = {
  id: string;
  quantity: string;
  unitPrice: string;
  total: string;
  product: {
    id: string;
    name: string;
    sku: string | null;
  };
};

type Product = {
  id: string;
  name: string;
  sku: string | null;
  purchasePrice: string;
};

export default function PurchaseOrderDetailsPage() {
  const params = useParams();
  const orderId = params.orderId as string;

  const [order, setOrder] =
    useState<PurchaseOrder | null>(null);

  const [purchaseItems, setPurchaseItems] =
    useState<PurchaseItem[]>([]);

  const [products, setProducts] =
    useState<Product[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [itemsLoading, setItemsLoading] =
    useState(true);

  const [productsLoading, setProductsLoading] =
    useState(true);

  const [selectedProductId, setSelectedProductId] =
    useState("");

  const [quantity, setQuantity] =
    useState("");

  const [unitPrice, setUnitPrice] =
    useState("");

  const [addingItem, setAddingItem] =
    useState(false);

  const [itemMessage, setItemMessage] =
    useState("");

  const [itemError, setItemError] =
    useState("");

  const [updatingStatus, setUpdatingStatus] =
    useState(false);

  const [statusMessage, setStatusMessage] =
    useState("");

  const [statusError, setStatusError] =
    useState("");

  useEffect(() => {
    async function loadPurchaseOrder() {
      try {
        setLoading(true);

        const response = await fetch(
          `/api/purchase-orders?businessId=${BUSINESS_ID}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              "Failed to load purchase orders"
          );
        }

        const foundOrder =
          data.purchaseOrders.find(
            (item: PurchaseOrder) =>
              item.id === orderId
          );

        if (!foundOrder) {
          throw new Error(
            "Purchase order not found"
          );
        }

        setOrder(foundOrder);
      } catch (err) {
        console.error(
          "Failed to load purchase order:",
          err
        );
      } finally {
        setLoading(false);
      }
    }

    if (orderId) {
      loadPurchaseOrder();
    }
  }, [orderId]);

  async function loadPurchaseItems() {
    try {
      setItemsLoading(true);

      const response = await fetch(
        `/api/purchase-orders/items?businessId=${BUSINESS_ID}&purchaseOrderId=${orderId}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to load purchase items"
        );
      }

      setPurchaseItems(
        data.purchaseItems
      );
    } catch (err) {
      console.error(
        "Failed to load purchase items:",
        err
      );
    } finally {
      setItemsLoading(false);
    }
  }

  useEffect(() => {
    if (orderId) {
      loadPurchaseItems();
    }
  }, [orderId]);

  useEffect(() => {
    async function loadProducts() {
      try {
        setProductsLoading(true);

        const response = await fetch(
          `/api/products?businessId=${BUSINESS_ID}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              "Failed to load products"
          );
        }

        setProducts(data.products);
      } catch (err) {
        console.error(
          "Failed to load products:",
          err
        );
      } finally {
        setProductsLoading(false);
      }
    }

    loadProducts();
  }, []);

  function handleProductChange(
    productId: string
  ) {
    setSelectedProductId(productId);
    setItemMessage("");
    setItemError("");

    const selectedProduct =
      products.find(
        (product) =>
          product.id === productId
      );

    if (selectedProduct) {
      setUnitPrice(
        String(
          Number(
            selectedProduct.purchasePrice
          )
        )
      );
    } else {
      setUnitPrice("");
    }
  }

  async function handleAddItem(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setItemMessage("");
    setItemError("");

    const quantityNumber =
      Number(quantity);

    const unitPriceNumber =
      Number(unitPrice);

    if (!selectedProductId) {
      setItemError(
        "Please select a product"
      );

      return;
    }

    if (
      !Number.isFinite(
        quantityNumber
      ) ||
      quantityNumber <= 0
    ) {
      setItemError(
        "Quantity must be greater than 0"
      );

      return;
    }

    if (
      !Number.isFinite(
        unitPriceNumber
      ) ||
      unitPriceNumber < 0
    ) {
      setItemError(
        "Unit price must be 0 or greater"
      );

      return;
    }

    try {
      setAddingItem(true);

      const response = await fetch(
        "/api/purchase-orders/items",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            businessId: BUSINESS_ID,
            purchaseOrderId: orderId,
            productId:
              selectedProductId,
            quantity:
              quantityNumber,
            unitPrice:
              unitPriceNumber,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to add purchase item"
        );
      }

      setQuantity("");
      setSelectedProductId("");
      setUnitPrice("");

      setItemMessage(
        "Purchase item added successfully"
      );

      await loadPurchaseItems();
    } catch (err) {
      setItemError(
        err instanceof Error
          ? err.message
          : "Failed to add purchase item"
      );
    } finally {
      setAddingItem(false);
    }
  }

  async function handleStatusChange(
    status: PurchaseOrderStatus
  ) {
    setStatusMessage("");
    setStatusError("");

    if (!order) {
      return;
    }

    try {
      setUpdatingStatus(true);

      const response = await fetch(
        "/api/purchase-orders/status",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            businessId: BUSINESS_ID,
            purchaseOrderId:
              order.id,
            status,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to update purchase order status"
        );
      }

      setOrder(
        (currentOrder) =>
          currentOrder
            ? {
                ...currentOrder,
                status:
                  data.purchaseOrder
                    .status,
              }
            : currentOrder
      );

      setStatusMessage(
        `Purchase order marked as ${status}.`
      );
    } catch (err) {
      console.error(
        "Purchase order status update failed:",
        err
      );

      setStatusError(
        err instanceof Error
          ? err.message
          : "Failed to update purchase order status."
      );
    } finally {
      setUpdatingStatus(false);
    }
  }

  function renderStatusActions() {
    if (!order) {
      return null;
    }

    if (order.status === "DRAFT") {
      return (
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() =>
              handleStatusChange(
                "ORDERED"
              )
            }
            disabled={updatingStatus}
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {updatingStatus
              ? "Updating..."
              : "Mark Ordered"}
          </button>

          <button
            type="button"
            onClick={() =>
              handleStatusChange(
                "CANCELLED"
              )
            }
            disabled={updatingStatus}
            className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel Order
          </button>
        </div>
      );
    }

    if (order.status === "ORDERED") {
      return (
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() =>
              handleStatusChange(
                "RECEIVED"
              )
            }
            disabled={updatingStatus}
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {updatingStatus
              ? "Updating..."
              : "Mark Received"}
          </button>

          <button
            type="button"
            onClick={() =>
              handleStatusChange(
                "CANCELLED"
              )
            }
            disabled={updatingStatus}
            className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel Order
          </button>
        </div>
      );
    }

    return (
      <p className="text-sm text-gray-500">
        No further status changes are
        available for this purchase
        order.
      </p>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen p-6">
        <div className="mx-auto max-w-5xl">
          <p className="text-gray-400">
            Loading purchase order...
          </p>
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="min-h-screen p-6">
        <div className="mx-auto max-w-5xl">
          <p className="mb-4 text-red-400">
            Purchase order not found
          </p>

          <Link
            href="/purchases"
            className="font-medium text-blue-400 underline"
          >
            Back to Purchases
          </Link>
        </div>
      </main>
    );
  }

  const canAddItems =
    order.status === "DRAFT";

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <Link
            href="/purchases"
            className="text-sm font-medium text-blue-400 underline underline-offset-4"
          >
            ← Back to Purchases
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">
            Purchase Order
          </h1>

          <p className="mt-2 text-gray-400">
            View supplier and purchase
            order information.
          </p>
        </div>

        <section className="rounded-lg border bg-white p-6 text-gray-900 shadow-sm">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <h2 className="text-xl font-semibold">
              Order Information
            </h2>

            <div className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium">
              {order.status}
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Supplier
              </p>

              <p className="mt-1 font-medium">
                {order.supplier.name}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-500">
                Status
              </p>

              <p className="mt-1 font-medium">
                {order.status}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-500">
                Created
              </p>

              <p className="mt-1">
                {new Date(
                  order.createdAt
                ).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="mt-6 border-t pt-6">
            <p className="mb-3 text-sm font-medium text-gray-500">
              Status Actions
            </p>

            {renderStatusActions()}

            {statusError && (
              <p className="mt-3 text-sm font-medium text-red-600">
                {statusError}
              </p>
            )}

            {statusMessage && (
              <p className="mt-3 text-sm font-medium text-green-600">
                {statusMessage}
              </p>
            )}
          </div>
        </section>

        <section className="mt-6 rounded-lg border bg-white p-6 text-gray-900 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">
            Supplier Information
          </h2>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Name
              </p>

              <p className="mt-1">
                {order.supplier.name}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-500">
                Phone
              </p>

              <p className="mt-1">
                {order.supplier.phone ||
                  "—"}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-500">
                Email
              </p>

              <p className="mt-1">
                {order.supplier.email ||
                  "—"}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-500">
                Address
              </p>

              <p className="mt-1">
                {order.supplier.address ||
                  "—"}
              </p>
            </div>
          </div>
        </section>

        {canAddItems ? (
          <section className="mt-6 rounded-lg border bg-white p-6 text-gray-900 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold">
              Add Purchase Item
            </h2>

            <form onSubmit={handleAddItem}>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Product
                  </label>

                  <select
                    value={
                      selectedProductId
                    }
                    onChange={(event) =>
                      handleProductChange(
                        event.target.value
                      )
                    }
                    disabled={
                      productsLoading ||
                      addingItem
                    }
                    className="w-full rounded-md border px-3 py-2"
                  >
                    <option value="">
                      {productsLoading
                        ? "Loading products..."
                        : "Select product"}
                    </option>

                    {products.map(
                      (product) => (
                        <option
                          key={product.id}
                          value={product.id}
                        >
                          {product.name}
                          {product.sku
                            ? ` (${product.sku})`
                            : ""}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Quantity
                  </label>

                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={quantity}
                    onChange={(event) =>
                      setQuantity(
                        event.target.value
                      )
                    }
                    disabled={addingItem}
                    placeholder="10"
                    className="w-full rounded-md border px-3 py-2"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Unit Price
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={unitPrice}
                    onChange={(event) =>
                      setUnitPrice(
                        event.target.value
                      )
                    }
                    disabled={addingItem}
                    placeholder="90"
                    className="w-full rounded-md border px-3 py-2"
                  />
                </div>
              </div>

              {itemError && (
                <p className="mt-4 text-sm font-medium text-red-600">
                  {itemError}
                </p>
              )}

              {itemMessage && (
                <p className="mt-4 text-sm font-medium text-green-600">
                  {itemMessage}
                </p>
              )}

              <button
                type="submit"
                disabled={addingItem}
                className="mt-5 rounded-md bg-black px-5 py-2 font-medium text-white disabled:opacity-50"
              >
                {addingItem
                  ? "Adding..."
                  : "Add Item"}
              </button>
            </form>
          </section>
        ) : (
          <section className="mt-6 rounded-lg border bg-gray-50 p-6 text-gray-900 shadow-sm">
            <h2 className="text-xl font-semibold">
              Purchase Items
            </h2>

            <p className="mt-2 text-sm text-gray-600">
              Items can only be added while the
              purchase order is in DRAFT status.
            </p>
          </section>
        )}

        <section className="mt-6 rounded-lg border bg-white p-6 text-gray-900 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">
            Current Purchase Items
          </h2>

          {itemsLoading ? (
            <p className="text-gray-600">
              Loading purchase items...
            </p>
          ) : purchaseItems.length ===
            0 ? (
            <p className="text-gray-600">
              No purchase items found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b text-sm text-gray-500">
                    <th className="px-3 py-3 font-medium">
                      Product
                    </th>

                    <th className="px-3 py-3 font-medium">
                      SKU
                    </th>

                    <th className="px-3 py-3 font-medium">
                      Quantity
                    </th>

                    <th className="px-3 py-3 font-medium">
                      Unit Price
                    </th>

                    <th className="px-3 py-3 font-medium">
                      Total
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {purchaseItems.map(
                    (item) => (
                      <tr
                        key={item.id}
                        className="border-b last:border-b-0"
                      >
                        <td className="px-3 py-4 font-medium">
                          {
                            item.product
                              .name
                          }
                        </td>

                        <td className="px-3 py-4">
                          {item.product
                            .sku || "—"}
                        </td>

                        <td className="px-3 py-4">
                          {Number(
                            item.quantity
                          )}
                        </td>

                        <td className="px-3 py-4">
                          ₹
                          {Number(
                            item.unitPrice
                          ).toFixed(2)}
                        </td>

                        <td className="px-3 py-4 font-medium">
                          ₹
                          {Number(
                            item.total
                          ).toFixed(2)}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}