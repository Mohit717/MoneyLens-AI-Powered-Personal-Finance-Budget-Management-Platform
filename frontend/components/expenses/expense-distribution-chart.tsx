"use client";

import React, { useSyncExternalStore, useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatCompactINR, formatINR } from "@/utils/format";
import { CategoryBudgetProgress, Transaction } from "@/utils/types";
import { Button } from "@/components/ui/button";
import { Plus, PieChart as PieIcon } from "lucide-react";

interface ExpenseDistributionChartProps {
  categoriesProgress: CategoryBudgetProgress[];
  transactions: Transaction[];
  period?: string;
  onAddExpense?: () => void;
}

const PALETTE = [
  "#F59E0B", // Amber / Food
  "#8B5CF6", // Purple / Shopping
  "#EC4899", // Pink / Transport
  "#3B82F6", // Blue / Housing
  "#6366F1", // Indigo / Utilities
  "#EF4444", // Red / Medical
  "#14B8A6", // Teal / Entertainment
  "#10B981", // Emerald / Other
];

// SSR safe hydration subscriber without cascading renders
const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

export function ExpenseDistributionChart({
  categoriesProgress,
  transactions,
  period,
  onAddExpense,
}: ExpenseDistributionChartProps) {
  const isMounted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Format month label
  const formattedMonth = useMemo(() => {
    if (!period || !/^\d{4}-\d{2}$/.test(period)) return "Selected Month";
    const [yearStr, monthStr] = period.split("-");
    const d = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10) - 1, 1);
    return new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(d);
  }, [period]);

  // Strictly filter transactions by selected period if provided
  const monthlyExpenses = useMemo(() => {
    return transactions.filter((t) => {
      if (t.type !== "EXPENSE" && t.type !== "INVESTMENT_ALLOCATION") return false;
      if (period && t.date) {
        return t.date.slice(0, 7) === period;
      }
      return true;
    });
  }, [transactions, period]);

  // Group monthly expense transactions by category
  const chartData = useMemo(() => {
    const categorySpendMap = new Map<string, number>();

    for (const tx of monthlyExpenses) {
      const catName = tx.category?.name || "Uncategorized";
      const current = categorySpendMap.get(catName) || 0;
      categorySpendMap.set(catName, current + tx.amount);
    }

    // Also include budgeted categories that have spending in this month
    for (const prog of categoriesProgress) {
      if (prog.actualSpent > 0 && !categorySpendMap.has(prog.category.name)) {
        categorySpendMap.set(prog.category.name, prog.actualSpent);
      }
    }

    return Array.from(categorySpendMap.entries())
      .map(([name, value], index) => ({
        name,
        value: Math.round(value * 100) / 100,
        color: PALETTE[index % PALETTE.length],
      }))
      .sort((a, b) => b.value - a.value);
  }, [monthlyExpenses, categoriesProgress]);

  const totalSpent = useMemo(
    () => chartData.reduce((acc, curr) => acc + curr.value, 0),
    [chartData]
  );

  if (!isMounted) {
    return (
      <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-xs flex flex-col items-center justify-center min-h-[360px] animate-pulse">
        <div className="w-40 h-40 rounded-full bg-muted/60" />
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-xs flex flex-col justify-between space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold text-foreground tracking-tight flex items-center gap-1.5">
            <PieIcon className="w-4 h-4 text-emerald-500" />
            <span>Expense Distribution</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Breakdown for {formattedMonth}
          </p>
        </div>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted border border-border/50 text-muted-foreground">
          {formattedMonth}
        </span>
      </div>

      {chartData.length === 0 || totalSpent === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-center p-6 space-y-3">
          <div className="w-16 h-16 rounded-full border-2 border-dashed border-border flex items-center justify-center text-muted-foreground text-xs font-semibold">
            ₹0.00
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-foreground">
              No expenses in {formattedMonth}
            </p>
            <p className="text-[11px] text-muted-foreground max-w-[200px]">
              Add your daily expenses to see category share and cash burn
            </p>
          </div>
          {onAddExpense && (
            <Button
              size="sm"
              variant="outline"
              onClick={onAddExpense}
              className="text-xs gap-1.5 rounded-xl h-8 text-rose-500 border-rose-500/30 hover:bg-rose-500/10 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Expense</span>
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4 my-2">
          {/* Donut Chart Container */}
          <div className="relative h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={88}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: unknown) => [
                    formatINR(typeof value === "number" ? value : 0),
                    "Spent",
                  ]}
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    borderColor: "var(--border)",
                    borderRadius: "0.75rem",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                    fontSize: "0.75rem",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Centered Total Spent Metric for this Month */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Total Spent
              </span>
              <span className="text-base font-bold text-foreground">
                {formatCompactINR(totalSpent)}
              </span>
            </div>
          </div>

          {/* Category Share List */}
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {chartData.map((item) => {
              const percent = totalSpent > 0 ? Math.round((item.value / totalSpent) * 100) : 0;
              return (
                <div
                  key={item.name}
                  className="flex items-center justify-between text-xs py-1 px-1.5 rounded-lg hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="truncate font-medium text-foreground">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-semibold text-foreground">{formatINR(item.value, false)}</span>
                    <span className="text-[10px] text-muted-foreground w-8 text-right font-medium">
                      {percent}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
