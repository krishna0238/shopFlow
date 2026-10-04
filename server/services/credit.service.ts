import { prisma } from "@/lib/prisma";
import type { CreateCreditTransactionInput } from "@/server/validation/credit.validation";

export class CreditService {
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
    const customer = await prisma.customer.findFirst({
      where: {
        id: input.customerId,
        businessId: input.businessId,
      },
    });

    if (!customer) {
      throw new Error("Customer not found");
    }

    if (input.type === "PAYMENT") {
      const currentBalance =
        await this.getCustomerBalance(
          input.businessId,
          input.customerId
        );

      if (input.amount > currentBalance.balance) {
        throw new Error(
          "Payment cannot exceed outstanding credit"
        );
      }
    }

    return prisma.creditTransaction.create({
      data: {
        businessId: input.businessId,
        customerId: input.customerId,
        type: input.type,
        amount: input.amount,
        note: input.note,
      },
    });
  }
}