import { AppError } from "../../middlewares/errorHandler.js";
import { CategoryRepository } from "../category/category.repository.js";
import { BudgetRepository, BudgetWithCategory } from "./budget.repository.js";
import { SetBudgetInput } from "./budget.schema.js";

export type BudgetStatus = "HEALTHY" | "WARNING" | "EXCEEDED";

export interface CategoryBudgetProgress {
  id: string;
  categoryId: string;
  category: {
    id: string;
    name: string;
    icon: string | null;
    color: string | null;
    type: string;
  };
  monthlyLimit: number;
  actualSpent: number;
  remaining: number;
  percentageUsed: number;
  status: BudgetStatus;
  rolloverEnabled: boolean;
}

export interface BudgetSummaryResponse {
  period: string;
  daysRemainingInMonth: number;
  totalDaysInMonth: number;
  categories: CategoryBudgetProgress[];
  summary: {
    totalBudgeted: number;
    totalSpentInBudgets: number;
    totalSpentOverall: number;
    totalIncome: number;
    remainingBudget: number;
    netSavings: number;
    budgetUtilizationRate: number;
  };
}

export class BudgetService {
  constructor(
    private readonly budgetRepository: BudgetRepository,
    private readonly categoryRepository: CategoryRepository
  ) {}

  private parsePeriodDates(period: string) {
    const [yearStr, monthStr] = period.split("-");
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10); // 1-indexed

    const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
    // Day 0 of next month gives the last day of current month
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
    const totalDaysInMonth = new Date(year, month, 0).getDate();

    const now = new Date();
    const currentPeriod = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;

    let daysRemainingInMonth = 0;
    if (period === currentPeriod) {
      daysRemainingInMonth = Math.max(0, totalDaysInMonth - now.getUTCDate());
    } else if (period > currentPeriod) {
      daysRemainingInMonth = totalDaysInMonth;
    } else {
      daysRemainingInMonth = 0;
    }

    return { startDate, endDate, totalDaysInMonth, daysRemainingInMonth };
  }

  async listBudgets(
    userId: string,
    period?: string
  ): Promise<(Omit<BudgetWithCategory, "monthlyLimit"> & { monthlyLimit: number })[]> {
    const targetPeriod =
      period || new Date().toISOString().slice(0, 7);

    const budgets = await this.budgetRepository.findByUserAndPeriod(userId, targetPeriod);

    return budgets.map((b) => ({
      ...b,
      monthlyLimit: parseFloat(b.monthlyLimit.toString()),
    }));
  }

  async getBudgetSummary(userId: string, period?: string): Promise<BudgetSummaryResponse> {
    const targetPeriod =
      period || new Date().toISOString().slice(0, 7);

    const { startDate, endDate, totalDaysInMonth, daysRemainingInMonth } =
      this.parsePeriodDates(targetPeriod);

    // 1. Get user budgets for this period
    const budgets = await this.budgetRepository.findByUserAndPeriod(userId, targetPeriod);

    // 2. Get spending data for this period
    const spendingData = await this.budgetRepository.getSpendingSummaryForPeriod(
      userId,
      startDate,
      endDate
    );

    const spendingMap = new Map<string, number>();
    for (const item of spendingData.categorySpending) {
      if (item.categoryId) {
        spendingMap.set(item.categoryId, item.total);
      }
    }

    let totalBudgeted = 0;
    let totalSpentInBudgets = 0;

    const categoriesProgress: CategoryBudgetProgress[] = budgets.map((budget) => {
      const limit = parseFloat(budget.monthlyLimit.toString());
      const spent = spendingMap.get(budget.categoryId) || 0;
      const remaining = Math.max(0, limit - spent);
      const percentageUsed = limit > 0 ? Math.round((spent / limit) * 10000) / 100 : 0;

      let status: BudgetStatus = "HEALTHY";
      if (percentageUsed >= 100) {
        status = "EXCEEDED";
      } else if (percentageUsed >= 75) {
        status = "WARNING";
      }

      totalBudgeted += limit;
      totalSpentInBudgets += spent;

      return {
        id: budget.id,
        categoryId: budget.categoryId,
        category: budget.category,
        monthlyLimit: limit,
        actualSpent: Math.round(spent * 100) / 100,
        remaining: Math.round(remaining * 100) / 100,
        percentageUsed,
        status,
        rolloverEnabled: budget.rolloverEnabled,
      };
    });

    const totalSpentOverall = Math.round(spendingData.totalExpenses * 100) / 100;
    const totalIncome = Math.round(spendingData.totalIncome * 100) / 100;
    const remainingBudget = Math.max(0, Math.round((totalBudgeted - totalSpentInBudgets) * 100) / 100);
    const netSavings = Math.round((totalIncome - totalSpentOverall) * 100) / 100;
    const budgetUtilizationRate =
      totalBudgeted > 0
        ? Math.round((totalSpentInBudgets / totalBudgeted) * 10000) / 100
        : 0;

    return {
      period: targetPeriod,
      daysRemainingInMonth,
      totalDaysInMonth,
      categories: categoriesProgress,
      summary: {
        totalBudgeted: Math.round(totalBudgeted * 100) / 100,
        totalSpentInBudgets: Math.round(totalSpentInBudgets * 100) / 100,
        totalSpentOverall,
        totalIncome,
        remainingBudget,
        netSavings,
        budgetUtilizationRate,
      },
    };
  }

  async setBudget(
    userId: string,
    data: SetBudgetInput
  ): Promise<Omit<BudgetWithCategory, "monthlyLimit"> & { monthlyLimit: number }> {
    const category = await this.categoryRepository.findById(data.categoryId);
    if (!category) {
      throw new AppError(404, "CATEGORY_NOT_FOUND", "Category not found");
    }

    if (category.type !== "EXPENSE") {
      throw new AppError(
        400,
        "INVALID_BUDGET_CATEGORY",
        "Budgets can only be assigned to EXPENSE categories"
      );
    }

    const budget = await this.budgetRepository.upsert(userId, data);
    return {
      ...budget,
      monthlyLimit: parseFloat(budget.monthlyLimit.toString()),
    };
  }

  async deleteBudget(userId: string, id: string): Promise<void> {
    const existing = await this.budgetRepository.findById(id, userId);
    if (!existing) {
      throw new AppError(404, "BUDGET_NOT_FOUND", "Budget not found");
    }

    await this.budgetRepository.delete(id, userId);
  }
}

