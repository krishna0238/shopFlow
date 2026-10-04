-- CreateEnum
CREATE TYPE "SalePaymentMode" AS ENUM ('CASH', 'UPI', 'CREDIT');

-- DropIndex
DROP INDEX "categories_businessId_name_key";

-- AlterTable
ALTER TABLE "products" ALTER COLUMN "stockQuantity" DROP DEFAULT,
ALTER COLUMN "lowStockThreshold" DROP DEFAULT;

-- AlterTable
ALTER TABLE "sales" ADD COLUMN     "paymentMode" "SalePaymentMode" NOT NULL DEFAULT 'CASH';

-- CreateIndex
CREATE INDEX "products_sku_idx" ON "products"("sku");
