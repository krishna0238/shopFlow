import { prisma } from "@/lib/prisma";
import { AuditService } from "@/server/services/audit.service";
import type { PrismaClient } from "@/app/generated/prisma/client";
import type { CreateCreditTransactionInput } from "@/server/validation/credit.validation";

type CreditDatabase = Pick<
  PrismaClient,
  "customer" | "creditTransaction"
>;

export class CreditService {
  private static async calculateCustomerBalance(
    database: CreditDatabase,
    businessId: string,
    customerId: string
  ) {
    const transactions =
      await database.creditTransaction.findMany({
        where: {
          businessId,
          customerId,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

    let balance = 0;

    for (const transaction of transactions) {
      if (transaction.type === "CREDIT") {
        balance += Number(transaction.amount);
      } else if (transaction.type === "PAYMENT") {
        balance -= Number(transaction.amount);
      }
    }

    return balance;
  }

  static async getCustomerBalance(
    businessId: string,
    customerId: string
  ) {
    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        businessId,
      },
    });

    if (!customer) {
      throw new Error("Customer not found");
    }

    const transactions = await prisma.creditTransaction.findMany({
      where: {
        businessId,
        customerId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    let balance = 0;

    for (const transaction of transactions) {
      if (transaction.type === "CREDIT") {
        balance += Number(transaction.amount);
      } else if (transaction.type === "PAYMENT") {
        balance -= Number(transaction.amount);
      }
    }

    return {
      customer,
      balance,
      transactions,
    };
  }

  static async createTransaction(
    input: CreateCreditTransactionInput
  ) {
    return prisma.$transaction(async (tx) => {
      const customer = await tx.customer.findFirst({
        where: {
          id: input.customerId,
          businessId: input.businessId,
        },
      });

      if (!customer) {
        throw new Error("Customer not found");
      }

      const previousBalance =
        await this.calculateCustomerBalance(
          tx,
          input.businessId,
          input.customerId
        );

      if (
        input.type === "PAYMENT" &&
        input.amount > previousBalance
      ) {
        throw new Error(
          "Payment cannot exceed outstanding credit"
        );
      }

      const transaction =
        await tx.creditTransaction.create({
          data: {
            businessId: input.businessId,
            customerId: input.customerId,
            type: input.type,
            amount: input.amount,
            note: input.note,
          },
        });

      const newBalance =
        input.type === "CREDIT"
          ? previousBalance + input.amount
          : previousBalance - input.amount;

      const action =
        input.type === "CREDIT"
          ? "CREDIT_TRANSACTION_CREATED"
          : "CREDIT_PAYMENT_RECORDED";

      await AuditService.log(
        {
          businessId: input.businessId,
          action,
          entityType: "CreditTransaction",
          entityId: transaction.id,
          details: {
            customerId: input.customerId,
            transactionType: input.type,
            amount: input.amount,
            previousBalance,
            newBalance,
            note: input.note ?? null,
          },
        },
        tx
      );

      return transaction;
    });
  }
}