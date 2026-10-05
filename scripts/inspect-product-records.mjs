import "dotenv/config";
import { Client } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const client = new Client({
  connectionString,
});

try {
  await client.connect();

  const result = await client.query(`
    SELECT
      id,
      name,
      sku,
      "purchasePrice",
      "sellingPrice",
      "stockQuantity",
      "lowStockThreshold",
      "isActive",
      "createdAt",
      "updatedAt"
    FROM products
    ORDER BY "createdAt" ASC;
  `);

  console.log("\n=== PRODUCT CREATION TIMELINE ===");
  console.table(result.rows);
} finally {
  await client.end();
}