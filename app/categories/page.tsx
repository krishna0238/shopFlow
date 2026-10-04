"use client";

import { FormEvent, useEffect, useState } from "react";

const BUSINESS_ID = "3b4fc147-7ea2-495f-a64e-878dfdabc158";

type Category = {
  id: string;
  businessId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadCategories() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/categories?businessId=${BUSINESS_ID}`
      );

      if (!response.ok) {
        throw new Error("Failed to load categories");
      }

      const data = await response.json();

      setCategories(
        Array.isArray(data)
          ? data
          : data.categories ?? []
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load categories"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Category name is required");
      setSuccess("");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await fetch("/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessId: BUSINESS_ID,
          name: trimmedName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ?? "Failed to create category"
        );
      }

      setCategories((current) =>
        [...current, data.category].sort((a, b) =>
          a.name.localeCompare(b.name)
        )
      );

      setName("");
      setSuccess("Category created successfully");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create category"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main
      style={{
        padding: "2rem",
        maxWidth: "900px",
      }}
    >
      <div>
        <h1>Categories</h1>

        <p
          style={{
            marginTop: "0.5rem",
            color: "#666",
          }}
        >
          Manage product categories for your shop.
        </p>
      </div>

      <section
        style={{
          marginTop: "2rem",
          padding: "1.5rem",
          border: "1px solid #ddd",
          borderRadius: "8px",
        }}
      >
        <h2>Add Category</h2>

        <form
          onSubmit={handleSubmit}
          style={{
            marginTop: "1rem",
            display: "flex",
            gap: "1rem",
            flexWrap: "wrap",
          }}
        >
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Category name"
            disabled={saving}
            style={{
              flex: "1",
              minWidth: "220px",
              padding: "0.75rem",
              border: "1px solid #ccc",
              borderRadius: "6px",
            }}
          />

          <button
            type="submit"
            disabled={saving}
            style={{
              padding: "0.75rem 1.25rem",
              border: "1px solid #ccc",
              borderRadius: "6px",
              cursor: saving ? "not-allowed" : "pointer",
            }}
          >
            {saving ? "Creating..." : "Add Category"}
          </button>
        </form>

        {error && (
          <p
            style={{
              marginTop: "1rem",
              color: "red",
            }}
          >
            {error}
          </p>
        )}

        {success && (
          <p
            style={{
              marginTop: "1rem",
              color: "green",
            }}
          >
            {success}
          </p>
        )}
      </section>

      <section
        style={{
          marginTop: "2rem",
        }}
      >
        <h2>Category List</h2>

        {loading ? (
          <p style={{ marginTop: "1rem" }}>
            Loading categories...
          </p>
        ) : categories.length === 0 ? (
          <p style={{ marginTop: "1rem" }}>
            No categories found.
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
                    Name
                  </th>

                  <th
                    style={{
                      textAlign: "left",
                      padding: "0.75rem",
                      borderBottom: "1px solid #ddd",
                    }}
                  >
                    Created
                  </th>
                </tr>
              </thead>

              <tbody>
                {categories.map((category) => (
                  <tr key={category.id}>
                    <td
                      style={{
                        padding: "0.75rem",
                        borderBottom: "1px solid #eee",
                      }}
                    >
                      {category.name}
                    </td>

                    <td
                      style={{
                        padding: "0.75rem",
                        borderBottom: "1px solid #eee",
                      }}
                    >
                      {new Date(
                        category.createdAt
                      ).toLocaleString()}
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