import { PrismaClient, Budget, Prisma } from "../../generated/prisma/client.js";
import { SetBudgetInput } from "./budget.schema.js";

export interface BudgetWithCategory extends Budget {
  category: {
    id: string;
    name: string;
    icon: string | null;
    color: string | null;
    type: string;
  };
}

export class BudgetRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByUserAndPeriod(userId: string, period: string): Promise<BudgetWithCategory[]> {
    const list = await this.prisma.budget.findMany({
      where: { userId, period },
      include: {
        category: {
          select: { id: true, name: true, icon: true, color: true, type: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return list as unknown as BudgetWithCategory[];
  }

  async findById(id: string, userId: string): Promise<BudgetWithCategory | null> {
    const budget = await this.prisma.budget.findFirst({
      where: { id, userId },
      include: {
        category: {
          select: { id: true, name: true, icon: true, color: true, type: true },
        },
      },
    });

    return budget as unknown as BudgetWithCategory | null;
  }

  async upsert(userId: string, data: SetBudgetInput): Promise<BudgetWithCategory> {
    const decimalLimit = new Prisma.Decimal(data.monthlyLimit);

    const budget = await this.prisma.budget.upsert({
      where: {
        userId_categoryId_period: {
          userId,
          categoryId: data.categoryId,
          period: data.period,
        },
      },
      create: {
        userId,
        categoryId: data.categoryId,
        monthlyLimit: decimalLimit,
        period: data.period,
        rolloverEnabled: data.rolloverEnabled ?? false,
      },
      update: {
        monthlyLimit: decimalLimit,
        rolloverEnabled: data.rolloverEnabled ?? false,
      },
      include: {
        category: {
          select: { id: true, name: true, icon: true, color: true, type: true },
        },
      },
    });

    return budget as unknown as BudgetWithCategory;
  }

  async delete(id: string, userId: string): Promise<Budget> {
    return this.prisma.budget.delete({
      where: { id, userId },
    });
  }

  async getSpendingSummaryForPeriod(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    categorySpending: { categoryId: string | null; total: number }[];
    totalExpenses: number;
    totalIncome: number;
  }> {
    // 1. Group expense transactions by category
    const expenseGroups = await this.prisma.transaction.groupBy({
      by: ["categoryId"],
      where: {
        userId,
        type: { in: ["EXPENSE", "INVESTMENT_ALLOCATION"] },
        date: { gte: startDate, lte: endDate },
      },
      _sum: { amount: true },
    });

    const categorySpending = expenseGroups.map((group) => ({
      categoryId: group.categoryId,
      total: group._sum.amount ? parseFloat(group._sum.amount.toString()) : 0,
    }));

    const totalExpenses = categorySpending.reduce((acc, curr) => acc + curr.total, 0);

    // 2. Total Income in period
    const incomeAggregate = await this.prisma.transaction.aggregate({
      where: {
        userId,
        type: "INCOME",
        date: { gte: startDate, lte: endDate },
      },
      _sum: { amount: true },
    });

    const totalIncome = incomeAggregate._sum.amount
      ? parseFloat(incomeAggregate._sum.amount.toString())
      : 0;

    return {
      categorySpending,
      totalExpenses,
      totalIncome,
    };
  }
}

