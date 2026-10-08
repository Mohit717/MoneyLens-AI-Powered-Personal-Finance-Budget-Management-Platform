"use client";

import React, { useSyncExternalStore } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatCompactINR, formatINR } from "@/utils/format";
import { CategoryBudgetProgress, Transaction } from "@/utils/types";

interface ExpenseDistributionChartProps {
  categoriesProgress: CategoryBudgetProgress[];
  transactions: Transaction[];
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
}: ExpenseDistributionChartProps) {
  const isMounted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Group expense transactions by category
  const expenseTransactions = transactions.filter((t) => t.type === "EXPENSE");
  const categorySpendMap = new Map<string, number>();

  for (const tx of expenseTransactions) {
    const catName = tx.category?.name || "Uncategorized";
    const current = categorySpendMap.get(catName) || 0;
    categorySpendMap.set(catName, current + tx.amount);
  }

  // Also include budgeted categories that have spending
  for (const prog of categoriesProgress) {
    if (prog.actualSpent > 0 && !categorySpendMap.has(prog.category.name)) {
      categorySpendMap.set(prog.category.name, prog.actualSpent);
    }
  }

  const chartData = Array.from(categorySpendMap.entries())
    .map(([name, value], index) => ({
      name,
      value: Math.round(value * 100) / 100,
      color: PALETTE[index % PALETTE.length],
    }))
    .sort((a, b) => b.value - a.value);

  const totalSpent = chartData.reduce((acc, curr) => acc + curr.value, 0);

  if (!isMounted) {
    return (
      <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-xs flex flex-col items-center justify-center min-h-[360px] animate-pulse">
        <div className="w-40 h-40 rounded-full bg-muted/60" />
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-xs flex flex-col justify-between">
      <div>
        <h2 className="text-sm font-bold text-foreground tracking-tight">
          Expense Distribution
        </h2>
        <p className="text-xs text-muted-foreground">
          Monthly spending breakdown by top categories
        </p>
      </div>

      {chartData.length === 0 || totalSpent === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-center p-6 space-y-2">
          <div className="w-20 h-20 rounded-full border-4 border-dashed border-border/80 flex items-center justify-center text-muted-foreground text-xs font-medium">
            ₹0.00
          </div>
          <p className="text-xs text-muted-foreground">
            No expenses recorded for this month yet.
          </p>
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

            {/* Centered Total Spent Metric */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Total
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
