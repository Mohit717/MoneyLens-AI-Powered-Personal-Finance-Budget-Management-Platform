"use client";

import React, { useMemo } from "react";
import { BudgetSummary } from "@/utils/types";
import { formatINR } from "@/utils/format";
import {
  TrendingUp,
  TrendingDown,
  PiggyBank,
  CalendarClock,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface SummaryBannerProps {
  data: BudgetSummary | null;
  period?: string;
  isLoading?: boolean;
  onAddIncome?: () => void;
  onAddExpense?: () => void;
}

export function SummaryBanner({
  data,
  period,
  isLoading,
  onAddIncome,
  onAddExpense,
}: SummaryBannerProps) {
  const formattedMonth = useMemo(() => {
    if (!period || !/^\d{4}-\d{2}$/.test(period)) return "Current Month";
    const [yearStr, monthStr] = period.split("-");
    const d = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10) - 1, 1);
    return new Intl.DateTimeFormat("en-IN", { month: "short", year: "numeric" }).format(d);
  }, [period]);

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-32 rounded-2xl bg-card border border-border/60 animate-pulse p-5"
          />
        ))}
      </div>
    );
  }

  const { summary, daysRemainingInMonth, totalDaysInMonth } = data;
  const daysElapsed = Math.max(1, totalDaysInMonth - daysRemainingInMonth);
  const dailyBurnRate = Math.round(summary.totalSpentOverall / daysElapsed);
  const netSavings = summary.totalIncome - summary.totalSpentOverall;
  const savingsRate =
    summary.totalIncome > 0
      ? Math.max(0, Math.round((netSavings / summary.totalIncome) * 100))
      : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Monthly Income Card */}
      <div className="p-5 rounded-2xl bg-card border border-border/60 shadow-xs flex flex-col justify-between hover:border-emerald-500/30 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {formattedMonth} Income
          </span>
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <TrendingUp className="w-4 h-4 stroke-[2.5]" />
          </div>
        </div>

        <div className="mt-3">
          <div className="text-2xl font-bold tracking-tight text-foreground">
            {formatINR(summary.totalIncome)}
          </div>

          {summary.totalIncome === 0 && onAddIncome ? (
            <div className="mt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={onAddIncome}
                className="w-full text-xs font-semibold h-7 rounded-lg text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add {formattedMonth} Income</span>
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between mt-1 text-[11px]">
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                Inflows for {formattedMonth}
              </span>
              {onAddIncome && (
                <button
                  type="button"
                  onClick={onAddIncome}
                  className="text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 font-medium cursor-pointer"
                >
                  + Add More
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2. Monthly Expenses Card */}
      <div className="p-5 rounded-2xl bg-card border border-border/60 shadow-xs flex flex-col justify-between hover:border-rose-500/30 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {formattedMonth} Expenses
          </span>
          <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
            <TrendingDown className="w-4 h-4 stroke-[2.5]" />
          </div>
        </div>

        <div className="mt-3">
          <div className="text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
            {formatINR(summary.totalSpentOverall)}
          </div>

          {summary.totalSpentOverall === 0 && onAddExpense ? (
            <div className="mt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={onAddExpense}
                className="w-full text-xs font-semibold h-7 rounded-lg text-rose-500 border-rose-500/30 hover:bg-rose-500/10 gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add {formattedMonth} Expense</span>
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between mt-1 text-[11px] text-muted-foreground">
              <span>Avg {formatINR(dailyBurnRate, false)}/day</span>
              {onAddExpense && (
                <button
                  type="button"
                  onClick={onAddExpense}
                  className="text-muted-foreground hover:text-rose-500 font-medium cursor-pointer"
                >
                  + Add More
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 3. Monthly Net Savings / Surplus Card */}
      <div className="p-5 rounded-2xl bg-card border border-border/60 shadow-xs flex flex-col justify-between hover:border-blue-500/30 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {formattedMonth} Net Savings
          </span>
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
            <PiggyBank className="w-4 h-4 stroke-[2.5]" />
          </div>
        </div>

        <div className="mt-3">
          <div
            className={`text-2xl font-bold tracking-tight ${
              netSavings >= 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400"
            }`}
          >
            {netSavings >= 0 ? `+${formatINR(netSavings)}` : formatINR(netSavings)}
          </div>

          <div className="flex items-center justify-between mt-1 text-[11px]">
            {summary.totalIncome > 0 ? (
              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                {savingsRate}% Savings Rate
              </span>
            ) : (
              <span className="text-muted-foreground">Add income to track savings</span>
            )}
            {summary.totalBudgeted > 0 && (
              <span className="text-muted-foreground">
                Rem. Budget: {formatINR(summary.remainingBudget, false)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 4. Month Pace & Days Left Card */}
      <div className="p-5 rounded-2xl bg-card border border-border/60 shadow-xs flex flex-col justify-between hover:border-indigo-500/30 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {formattedMonth} Pace
          </span>
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
            <CalendarClock className="w-4 h-4 stroke-[2.5]" />
          </div>
        </div>

        <div className="mt-3">
          <div className="text-2xl font-bold tracking-tight text-foreground">
            {daysRemainingInMonth > 0 ? `${daysRemainingInMonth} days left` : "Month ended"}
          </div>

          <div className="flex items-center justify-between mt-1 text-[11px] text-muted-foreground">
            <span>
              {summary.totalBudgeted > 0
                ? `${summary.budgetUtilizationRate}% budget used`
                : `${daysElapsed}/${totalDaysInMonth} days elapsed`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
