"use client";

import React from "react";
import { BudgetSummary } from "@/utils/types";
import { formatINR } from "@/utils/format";
import { TrendingUp, TrendingDown, Wallet, CalendarClock } from "lucide-react";

interface SummaryBannerProps {
  data: BudgetSummary | null;
  isLoading?: boolean;
}

export function SummaryBanner({ data, isLoading }: SummaryBannerProps) {
  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-28 rounded-2xl bg-card border border-border/60 animate-pulse p-5"
          />
        ))}
      </div>
    );
  }

  const { summary, daysRemainingInMonth, totalDaysInMonth } = data;
  const daysElapsed = Math.max(1, totalDaysInMonth - daysRemainingInMonth);
  const dailyBurnRate = Math.round(summary.totalSpentOverall / daysElapsed);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Income Card */}
      <div className="p-5 rounded-2xl bg-card border border-border/60 shadow-xs flex flex-col justify-between hover:border-emerald-500/30 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Total Income
          </span>
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <TrendingUp className="w-4 h-4 stroke-[2.5]" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold tracking-tight text-foreground">
            {formatINR(summary.totalIncome)}
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            <span>Inflows for current month</span>
          </div>
        </div>
      </div>

      {/* 2. Total Spent Card */}
      <div className="p-5 rounded-2xl bg-card border border-border/60 shadow-xs flex flex-col justify-between hover:border-rose-500/30 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Total Spent
          </span>
          <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
            <TrendingDown className="w-4 h-4 stroke-[2.5]" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
            {formatINR(summary.totalSpentOverall)}
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-muted-foreground">
            <span>Avg {formatINR(dailyBurnRate, false)}/day</span>
          </div>
        </div>
      </div>

      {/* 3. Remaining Budget Card */}
      <div className="p-5 rounded-2xl bg-card border border-border/60 shadow-xs flex flex-col justify-between hover:border-blue-500/30 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Remaining Budget
          </span>
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
            <Wallet className="w-4 h-4 stroke-[2.5]" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold tracking-tight text-foreground">
            {formatINR(summary.remainingBudget)}
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-muted-foreground">
            <span>Of {formatINR(summary.totalBudgeted)} monthly budget</span>
          </div>
        </div>
      </div>

      {/* 4. Days Left & Burn Velocity */}
      <div className="p-5 rounded-2xl bg-card border border-border/60 shadow-xs flex flex-col justify-between hover:border-indigo-500/30 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Month Progress
          </span>
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
            <CalendarClock className="w-4 h-4 stroke-[2.5]" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold tracking-tight text-foreground">
            {daysRemainingInMonth} <span className="text-sm font-medium text-muted-foreground">days left</span>
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-muted-foreground">
            <span>
              {summary.budgetUtilizationRate}% budget utilized
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
