import "dotenv/config";
import { Client } from "pg";

const productId = "58597cf0-3e36-4c3d-89ad-d812e72912c7";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const client = new Client({
  connectionString,
});

try {
  await client.connect();

  const productResult = await client.query(
    `
    SELECT
      id,
      name,
      "purchasePrice",
      "sellingPrice",
      "stockQuantity",
      "lowStockThreshold",
      "isActive",
      "createdAt",
      "updatedAt"
    FROM products
    WHERE id = $1;
    `,
    [productId]
  );

  const movementResult = await client.query(
    `
    SELECT
      id,
      type,
      quantity,
      "referenceId",
      note,
      "createdAt"
    FROM inventory_movements
    WHERE "productId" = $1
    ORDER BY "createdAt" ASC;
    `,
    [productId]
  );

  const totalsResult = await client.query(
    `
    SELECT
      COALESCE(SUM(quantity), 0) AS "movementTotal",
      COALESCE(
        SUM(
          CASE
            WHEN type = 'PURCHASE' THEN quantity
            WHEN type = 'SALE' THEN quantity
            WHEN type = 'ADJUSTMENT' THEN quantity
            ELSE 0
          END
        ),
        0
      ) AS "calculatedTotal"
    FROM inventory_movements
    WHERE "productId" = $1;
    `,
    [productId]
  );

  console.log("\n=== USB CABLE PRODUCT ===");
  console.table(productResult.rows);

  console.log("\n=== INVENTORY MOVEMENTS ===");
  console.table(movementResult.rows);

  console.log("\n=== MOVEMENT TOTAL ===");
  console.table(totalsResult.rows);

  if (productResult.rows.length === 0) {
    console.log("\nProduct not found.");
  } else {
    const storedStock = Number(productResult.rows[0].stockQuantity);
    const movementTotal = Number(totalsResult.rows[0].movementTotal);
    const difference = storedStock - movementTotal;

    console.log("\n=== RECONCILIATION ===");
    console.log(`Stored product stock : ${storedStock}`);
    console.log(`Movement total      : ${movementTotal}`);
    console.log(`Difference          : ${difference}`);
  }
} finally {
  await client.end();
}