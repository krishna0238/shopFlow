-- CreateEnum
CREATE TYPE "CreditTransactionType" AS ENUM ('CREDIT', 'PAYMENT');

-- CreateTable
CREATE TABLE "credit_transactions" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "type" "CreditTransactionType" NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credit_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "credit_transactions_businessId_idx" ON "credit_transactions"("businessId");

-- CreateIndex
CREATE INDEX "credit_transactions_customerId_idx" ON "credit_transactions"("customerId");

-- CreateIndex
CREATE INDEX "credit_transactions_customerId_createdAt_idx" ON "credit_transactions"("customerId", "createdAt");

-- AddForeignKey
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
