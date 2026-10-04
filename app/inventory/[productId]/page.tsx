"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const BUSINESS_ID = "3b4fc147-7ea2-495f-a64e-878dfdabc158";

type ProductCategory = {
  id: string;
  name: string;
};

type Product = {
  id: string;
  name: string;
  sku: string | null;
  purchasePrice: string | number;
  sellingPrice: string | number;
  stockQuantity: string | number;
  lowStockThreshold: string | number;
  isActive: boolean;
  category: ProductCategory | null;
};

type InventoryMovement = {
  id: string;
  type: string;
  quantity: string | number;
  note: string | null;
  referenceId: string | null;
  createdAt: string;
};

type PriceHistoryEntry = {
  id: string;
  type: "PURCHASE" | "SALE";
  price: number;
  quantity: number;
  date: string;
  status: string;
  referenceId: string;
  reference: string;
  paymentMode?: "CASH" | "UPI" | "CREDIT";
};

type PriceHistoryResponse = {
  product: {
    id: string;
    name: string;
  };
  currentPrices: {
    purchasePrice: number;
    sellingPrice: number;
  };
  history: PriceHistoryEntry[];
};

export default function ProductDetailsPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const [productId, setProductId] = useState("");
  const [product, setProduct] = useState<Product | null>(null);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [priceHistory, setPriceHistory] = useState<PriceHistoryEntry[]>([]);
  const [currentPrices, setCurrentPrices] = useState<{
    purchasePrice: number;
    sellingPrice: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    params.then(({ productId: id }) => {
      setProductId(id);
    });
  }, [params]);

  useEffect(() => {
    if (!productId) {
      return;
    }

    async function loadProductDetails() {
      try {
        setLoading(true);
        setError("");

        const [
          productsResponse,
          movementsResponse,
          priceHistoryResponse,
        ] = await Promise.all([
          fetch(`/api/products?businessId=${BUSINESS_ID}`),
          fetch(
            `/api/inventory?businessId=${BUSINESS_ID}&productId=${productId}`
          ),
          fetch(
            `/api/products/price-history?businessId=${BUSINESS_ID}&productId=${productId}`
          ),
        ]);

        if (!productsResponse.ok) {
          throw new Error("Failed to load products");
        }

        if (!movementsResponse.ok) {
          throw new Error("Failed to load inventory history");
        }

        if (!priceHistoryResponse.ok) {
          throw new Error("Failed to load price history");
        }

        const productsData = await productsResponse.json();
        const movementsData = await movementsResponse.json();
        const priceHistoryData: PriceHistoryResponse =
          await priceHistoryResponse.json();

        const products = Array.isArray(productsData)
          ? productsData
          : productsData.products ?? [];

        const selectedProduct = products.find(
          (item: Product) => item.id === productId
        );

        if (!selectedProduct) {
          throw new Error("Product not found");
        }

        setProduct(selectedProduct);

        const movementList = Array.isArray(movementsData)
          ? movementsData
          : movementsData.movements ?? [];

        setMovements(movementList);

        setPriceHistory(priceHistoryData.history ?? []);
        setCurrentPrices(priceHistoryData.currentPrices);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load product details"
        );
      } finally {
        setLoading(false);
      }
    }

    loadProductDetails();
  }, [productId]);

  if (loading) {
    return (
      <main style={{ padding: "2rem" }}>
        <p>Loading product details...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main style={{ padding: "2rem" }}>
        <h1>Product Details</h1>

        <p style={{ color: "red", marginTop: "1rem" }}>
          {error}
        </p>

        <div style={{ marginTop: "1.5rem" }}>
          <Link href="/inventory">Back to Inventory</Link>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main style={{ padding: "2rem" }}>
        <h1>Product not found</h1>

        <div style={{ marginTop: "1.5rem" }}>
          <Link href="/inventory">Back to Inventory</Link>
        </div>
      </main>
    );
  }

  const stockQuantity = Number(product.stockQuantity);
  const lowStockThreshold = Number(product.lowStockThreshold);

  const stockStatus =
    stockQuantity <= lowStockThreshold
      ? "Low stock"
      : "In stock";

  return (
    <main style={{ padding: "2rem", maxWidth: "1100px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "1rem",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1>{product.name}</h1>

          <p style={{ marginTop: "0.5rem", color: "#666" }}>
            Product details and inventory history
          </p>
        </div>

        <Link href="/inventory">Back to Inventory</Link>
      </div>

      <section
        style={{
          marginTop: "2rem",
          padding: "1.5rem",
          border: "1px solid #ddd",
          borderRadius: "8px",
        }}
      >
        <h2>Product Information</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "1.5rem",
            marginTop: "1.5rem",
          }}
        >
          <div>
            <strong>Product</strong>
            <p>{product.name}</p>
          </div>

          <div>
            <strong>Category</strong>
            <p>{product.category?.name || "—"}</p>
          </div>

          <div>
            <strong>SKU</strong>
            <p>{product.sku || "—"}</p>
          </div>

          <div>
            <strong>Purchase Price</strong>
            <p>
              ₹
              {Number(
                currentPrices?.purchasePrice ??
                  product.purchasePrice
              ).toFixed(2)}
            </p>
          </div>

          <div>
            <strong>Selling Price</strong>
            <p>
              ₹
              {Number(
                currentPrices?.sellingPrice ??
                  product.sellingPrice
              ).toFixed(2)}
            </p>
          </div>

          <div>
            <strong>Current Stock</strong>
            <p>{stockQuantity}</p>
          </div>

          <div>
            <strong>Low Stock Threshold</strong>
            <p>{lowStockThreshold}</p>
          </div>

          <div>
            <strong>Status</strong>
            <p>{stockStatus}</p>
          </div>

          <div>
            <strong>Active</strong>
            <p>{product.isActive ? "Yes" : "No"}</p>
          </div>
        </div>
      </section>

      <section
        style={{
          marginTop: "2rem",
          padding: "1.5rem",
          border: "1px solid #ddd",
          borderRadius: "8px",
        }}
      >
        <h2>Price History</h2>

        <p style={{ marginTop: "0.5rem", color: "#666" }}>
          Historical purchase and selling prices recorded from
          confirmed purchases and completed sales.
        </p>

        {priceHistory.length === 0 ? (
          <p style={{ marginTop: "1rem" }}>
            No price history recorded for this product.
          </p>
        ) : (
          <div
            style={{
              overflowX: "auto",
              marginTop: "1rem",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: "900px",
              }}
            >
              <thead>
                <tr>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "0.75rem",
                      borderBottom: "1px solid #ddd",
                    }}
                  >
                    Date
                  </th>

                  <th
                    style={{
                      textAlign: "left",
                      padding: "0.75rem",
                      borderBottom: "1px solid #ddd",
                    }}
                  >
                    Type
                  </th>

                  <th
                    style={{
                      textAlign: "right",
                      padding: "0.75rem",
                      borderBottom: "1px solid #ddd",
                    }}
                  >
                    Price
                  </th>

                  <th
                    style={{
                      textAlign: "right",
                      padding: "0.75rem",
                      borderBottom: "1px solid #ddd",
                    }}
                  >
                    Quantity
                  </th>

                  <th
                    style={{
                      textAlign: "left",
                      padding: "0.75rem",
                      borderBottom: "1px solid #ddd",
                    }}
                  >
                    Reference
                  </th>

                  <th
                    style={{
                      textAlign: "left",
                      padding: "0.75rem",
                      borderBottom: "1px solid #ddd",
                    }}
                  >
                    Payment
                  </th>
                </tr>
              </thead>

              <tbody>
                {priceHistory.map((entry) => (
                  <tr key={entry.id}>
                    <td
                      style={{
                        padding: "0.75rem",
                        borderBottom: "1px solid #eee",
                      }}
                    >
                      {new Date(
                        entry.date
                      ).toLocaleString()}
                    </td>

                    <td
                      style={{
                        padding: "0.75rem",
                        borderBottom: "1px solid #eee",
                      }}
                    >
                      {entry.type}
                    </td>

                    <td
                      style={{
                        padding: "0.75rem",
                        borderBottom: "1px solid #eee",
                        textAlign: "right",
                      }}
                    >
                      ₹{Number(entry.price).toFixed(2)}
                    </td>

                    <td
                      style={{
                        padding: "0.75rem",
                        borderBottom: "1px solid #eee",
                        textAlign: "right",
                      }}
                    >
                      {Number(entry.quantity)}
                    </td>

                    <td
                      style={{
                        padding: "0.75rem",
                        borderBottom: "1px solid #eee",
                      }}
                    >
                      {entry.reference}
                    </td>

                    <td
                      style={{
                        padding: "0.75rem",
                        borderBottom: "1px solid #eee",
                      }}
                    >
                      {entry.paymentMode || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section style={{ marginTop: "2rem" }}>
        <h2>Stock Movement History</h2>

        {movements.length === 0 ? (
          <p style={{ marginTop: "1rem" }}>
            No stock movements recorded for this product.
          </p>
        ) : (
          <div
            style={{
              overflowX: "auto",
              marginTop: "1rem",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: "750px",
              }}
            >
              <thead>
                <tr>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "0.75rem",
                      borderBottom: "1px solid #ddd",
                    }}
                  >
                    Date
                  </th>

                  <th
                    style={{
                      textAlign: "left",
                      padding: "0.75rem",
                      borderBottom: "1px solid #ddd",
                    }}
                  >
                    Type
                  </th>

                  <th
                    style={{
                      textAlign: "right",
                      padding: "0.75rem",
                      borderBottom: "1px solid #ddd",
                    }}
                  >
                    Quantity
                  </th>

                  <th
                    style={{
                      textAlign: "left",
                      padding: "0.75rem",
                      borderBottom: "1px solid #ddd",
                    }}
                  >
                    Note
                  </th>

                  <th
                    style={{
                      textAlign: "left",
                      padding: "0.75rem",
                      borderBottom: "1px solid #ddd",
                    }}
                  >
                    Reference
                  </th>
                </tr>
              </thead>

              <tbody>
                {movements.map((movement) => (
                  <tr key={movement.id}>
                    <td
                      style={{
                        padding: "0.75rem",
                        borderBottom: "1px solid #eee",
                      }}
                    >
                      {new Date(
                        movement.createdAt
                      ).toLocaleString()}
                    </td>

                    <td
                      style={{
                        padding: "0.75rem",
                        borderBottom: "1px solid #eee",
                      }}
                    >
                      {movement.type}
                    </td>

                    <td
                      style={{
                        padding: "0.75rem",
                        borderBottom: "1px solid #eee",
                        textAlign: "right",
                      }}
                    >
                      {Number(movement.quantity)}
                    </td>

                    <td
                      style={{
                        padding: "0.75rem",
                        borderBottom: "1px solid #eee",
                      }}
                    >
                      {movement.note || "—"}
                    </td>

                    <td
                      style={{
                        padding: "0.75rem",
                        borderBottom: "1px solid #eee",
                        fontFamily: "monospace",
                        fontSize: "0.85rem",
                      }}
                    >
                      {movement.referenceId || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}