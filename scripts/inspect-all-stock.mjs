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
      p.id,
      p.name,
      p."stockQuantity",
      COALESCE(SUM(im.quantity), 0) AS "movementTotal",
      p."stockQuantity" - COALESCE(SUM(im.quantity), 0) AS difference
    FROM products p
    LEFT JOIN inventory_movements im
      ON im."productId" = p.id
    GROUP BY
      p.id,
      p.name,
      p."stockQuantity"
    ORDER BY
      ABS(
        p."stockQuantity" - COALESCE(SUM(im.quantity), 0)
      ) DESC,
      p.name ASC;
  `);

  console.log("\n=== STOCK RECONCILIATION FOR ALL PRODUCTS ===");
  console.table(result.rows);

  const discrepancies = result.rows.filter(
    (row) => Number(row.difference) !== 0
  );

  console.log("\n=== SUMMARY ===");
  console.log(`Products checked : ${result.rows.length}`);
  console.log(`Discrepancies    : ${discrepancies.length}`);

  if (discrepancies.length === 0) {
    console.log("\nAll products are reconciled.");
  } else {
    console.log("\nProducts with discrepancies:");

    for (const row of discrepancies) {
      console.log(
        `- ${row.name}: stored=${row.stockQuantity}, movements=${row.movementTotal}, difference=${row.difference}`
      );
    }
  }
} finally {
  await client.end();
}