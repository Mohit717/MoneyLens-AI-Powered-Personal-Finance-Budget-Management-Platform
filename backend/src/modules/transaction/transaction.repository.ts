import {
  PrismaClient,
  Transaction,
  Prisma,
  TransactionType,
} from "../../generated/prisma/client.js";
import { GetTransactionsQuery } from "./transaction.schema.js";

export interface TransactionWithDetails extends Transaction {
  account: { id: string; name: string; type: string; currency: string };
  destinationAccount?: { id: string; name: string; type: string; currency: string } | null;
  category?: { id: string; name: string; icon: string | null; color: string | null } | null;
}

export type TransactionDTO = Omit<TransactionWithDetails, "amount"> & { amount: number };

export interface PaginatedTransactionsResult {
  transactions: TransactionDTO[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  summary: {
    totalIncome: number;
    totalExpense: number;
    netCashFlow: number;
  };
}

export class TransactionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findPaginated(
    userId: string,
    query: GetTransactionsQuery
  ): Promise<PaginatedTransactionsResult> {
    const {
      page,
      limit,
      startDate,
      endDate,
      accountId,
      categoryId,
      type,
      search,
      sortBy,
      sortOrder,
    } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.TransactionWhereInput = {
      userId,
      ...(type ? { type } : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(accountId
        ? {
            OR: [{ accountId }, { destinationAccountId: accountId }],
          }
        : {}),
      ...(startDate || endDate
        ? {
            date: {
              ...(startDate ? { gte: new Date(startDate) } : {}),
              ...(endDate
                ? {
                    lte: endDate.length === 10
                      ? new Date(`${endDate}T23:59:59.999Z`)
                      : new Date(endDate),
                  }
                : {}),
            },
          }
        : {}),
      ...(search
        ? {
            OR: [
              { payee: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
              { notes: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [rawTransactions, total, groupedAmounts] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          account: {
            select: { id: true, name: true, type: true, currency: true },
          },
          destinationAccount: {
            select: { id: true, name: true, type: true, currency: true },
          },
          category: {
            select: { id: true, name: true, icon: true, color: true },
          },
        },
      }),
      this.prisma.transaction.count({ where }),
      this.prisma.transaction.groupBy({
        by: ["type"],
        where,
        _sum: { amount: true },
      }),
    ]);

    let totalIncome = 0;
    let totalExpense = 0;

    for (const group of groupedAmounts) {
      const sum = group._sum.amount ? parseFloat(group._sum.amount.toString()) : 0;
      if (group.type === "INCOME") {
        totalIncome += sum;
      } else if (group.type === "EXPENSE" || group.type === "INVESTMENT_ALLOCATION") {
        totalExpense += sum;
      }
    }

    const formattedTransactions: TransactionDTO[] = rawTransactions.map((tx) => ({
      ...tx,
      amount: parseFloat(tx.amount.toString()),
    }));

    return {
      transactions: formattedTransactions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
      summary: {
        totalIncome: Math.round(totalIncome * 100) / 100,
        totalExpense: Math.round(totalExpense * 100) / 100,
        netCashFlow: Math.round((totalIncome - totalExpense) * 100) / 100,
      },
    };
  }

  async findById(id: string, userId: string): Promise<TransactionWithDetails | null> {
    const tx = await this.prisma.transaction.findFirst({
      where: { id, userId },
      include: {
        account: {
          select: { id: true, name: true, type: true, currency: true },
        },
        destinationAccount: {
          select: { id: true, name: true, type: true, currency: true },
        },
        category: {
          select: { id: true, name: true, icon: true, color: true },
        },
      },
    });

    return tx as unknown as TransactionWithDetails | null;
  }

  async createWithLedgerReconciliation(
    userId: string,
    data: {
      accountId: string;
      destinationAccountId?: string | null;
      categoryId?: string | null;
      amount: number;
      type: TransactionType;
      date?: Date;
      payee?: string | null;
      description?: string | null;
      notes?: string | null;
      tags?: string[];
      receiptUrl?: string | null;
    }
  ): Promise<TransactionWithDetails> {
    return this.prisma.$transaction(async (tx) => {
      const decimalAmount = new Prisma.Decimal(data.amount);

      // Apply balance changes
      await this.applyBalanceImpact(
        tx,
        data.type,
        decimalAmount,
        data.accountId,
        data.destinationAccountId
      );

      // Create transaction
      const created = await tx.transaction.create({
        data: {
          userId,
          accountId: data.accountId,
          destinationAccountId: data.destinationAccountId || null,
          categoryId: data.categoryId || null,
          amount: decimalAmount,
          type: data.type,
          date: data.date || new Date(),
          payee: data.payee || null,
          description: data.description || null,
          notes: data.notes || null,
          tags: data.tags || [],
          receiptUrl: data.receiptUrl || null,
        },
        include: {
          account: {
            select: { id: true, name: true, type: true, currency: true },
          },
          destinationAccount: {
            select: { id: true, name: true, type: true, currency: true },
          },
          category: {
            select: { id: true, name: true, icon: true, color: true },
          },
        },
      });

      return created as unknown as TransactionWithDetails;
    });
  }

  async updateWithLedgerReconciliation(
    userId: string,
    id: string,
    existing: Transaction,
    updates: {
      accountId?: string;
      destinationAccountId?: string | null;
      categoryId?: string | null;
      amount?: number;
      type?: TransactionType;
      date?: Date;
      payee?: string | null;
      description?: string | null;
      notes?: string | null;
      tags?: string[];
      receiptUrl?: string | null;
    }
  ): Promise<TransactionWithDetails> {
    return this.prisma.$transaction(async (tx) => {
      // Step 1: Revert old transaction balance impact
      await this.revertBalanceImpact(
        tx,
        existing.type,
        existing.amount,
        existing.accountId,
        existing.destinationAccountId
      );

      const targetType = updates.type || existing.type;
      const targetAmount =
        updates.amount !== undefined ? new Prisma.Decimal(updates.amount) : existing.amount;
      const targetAccountId = updates.accountId || existing.accountId;
      const targetDestinationAccountId =
        updates.destinationAccountId !== undefined
          ? updates.destinationAccountId
          : existing.destinationAccountId;

      // Step 2: Apply new transaction balance impact
      await this.applyBalanceImpact(
        tx,
        targetType,
        targetAmount,
        targetAccountId,
        targetDestinationAccountId
      );

      // Step 3: Update transaction record
      const updated = await tx.transaction.update({
        where: { id, userId },
        data: {
          ...(updates.accountId && { accountId: updates.accountId }),
          ...(updates.destinationAccountId !== undefined && {
            destinationAccountId: updates.destinationAccountId,
          }),
          ...(updates.categoryId !== undefined && { categoryId: updates.categoryId }),
          ...(updates.amount !== undefined && { amount: targetAmount }),
          ...(updates.type && { type: updates.type }),
          ...(updates.date && { date: updates.date }),
          ...(updates.payee !== undefined && { payee: updates.payee }),
          ...(updates.description !== undefined && { description: updates.description }),
          ...(updates.notes !== undefined && { notes: updates.notes }),
          ...(updates.tags !== undefined && { tags: updates.tags }),
          ...(updates.receiptUrl !== undefined && { receiptUrl: updates.receiptUrl }),
        },
        include: {
          account: {
            select: { id: true, name: true, type: true, currency: true },
          },
          destinationAccount: {
            select: { id: true, name: true, type: true, currency: true },
          },
          category: {
            select: { id: true, name: true, icon: true, color: true },
          },
        },
      });

      return updated as unknown as TransactionWithDetails;
    });
  }

  async deleteWithLedgerReconciliation(
    userId: string,
    existing: Transaction
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // Revert balance impact
      await this.revertBalanceImpact(
        tx,
        existing.type,
        existing.amount,
        existing.accountId,
        existing.destinationAccountId
      );

      // Delete transaction
      await tx.transaction.delete({
        where: { id: existing.id, userId },
      });
    });
  }

  private async applyBalanceImpact(
    tx: Prisma.TransactionClient,
    type: TransactionType,
    amount: Prisma.Decimal,
    accountId: string,
    destinationAccountId?: string | null
  ): Promise<void> {
    if (type === "EXPENSE" || type === "INVESTMENT_ALLOCATION") {
      await tx.account.update({
        where: { id: accountId },
        data: { balance: { decrement: amount } },
      });
    } else if (type === "INCOME") {
      await tx.account.update({
        where: { id: accountId },
        data: { balance: { increment: amount } },
      });
    } else if (type === "TRANSFER") {
      if (!destinationAccountId) {
        throw new Error("Destination account is required for transfer");
      }
      await tx.account.update({
        where: { id: accountId },
        data: { balance: { decrement: amount } },
      });
      await tx.account.update({
        where: { id: destinationAccountId },
        data: { balance: { increment: amount } },
      });
    }
  }

  private async revertBalanceImpact(
    tx: Prisma.TransactionClient,
    type: TransactionType,
    amount: Prisma.Decimal,
    accountId: string,
    destinationAccountId?: string | null
  ): Promise<void> {
    if (type === "EXPENSE" || type === "INVESTMENT_ALLOCATION") {
      await tx.account.update({
        where: { id: accountId },
        data: { balance: { increment: amount } },
      });
    } else if (type === "INCOME") {
      await tx.account.update({
        where: { id: accountId },
        data: { balance: { decrement: amount } },
      });
    } else if (type === "TRANSFER") {
      if (destinationAccountId) {
        await tx.account.update({
          where: { id: accountId },
          data: { balance: { increment: amount } },
        });
        await tx.account.update({
          where: { id: destinationAccountId },
          data: { balance: { decrement: amount } },
        });
      }
    }
  }
}
