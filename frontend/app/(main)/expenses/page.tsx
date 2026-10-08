"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useQuickAdd } from "@/context/quick-add-context";
import {
  getAccountsAction,
  getBudgetSummaryAction,
  getCategoriesAction,
  getTransactionsAction,
} from "@/app/actions/finance";
import {
  Account,
  BudgetSummary,
  Category,
  Transaction,
} from "@/utils/types";
import { SummaryBanner } from "@/components/expenses/summary-banner";
import { AccountsBar } from "@/components/accounts/accounts-bar";
import { BudgetProgressCards } from "@/components/expenses/budget-progress-cards";
import { ExpenseDistributionChart } from "@/components/expenses/expense-distribution-chart";
import { TransactionsTable } from "@/components/expenses/transactions-table";
import { Button } from "@/components/ui/button";
import {
  RefreshCw,
  Calendar,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

export default function ExpensesPage() {
  const { openQuickAdd } = useQuickAdd();

  // Period state (default current YYYY-MM)
  const [period, setPeriod] = useState<string>(() =>
    new Date().toISOString().slice(0, 7)
  );

  const [budgetSummary, setBudgetSummary] = useState<BudgetSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Month navigation helpers
  const goToPrevMonth = () => {
    const [yStr, mStr] = period.split("-");
    const year = parseInt(yStr, 10);
    const month = parseInt(mStr, 10);
    const prevDate = new Date(year, month - 2, 1);
    const ym = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;
    setPeriod(ym);
  };

  const goToNextMonth = () => {
    const [yStr, mStr] = period.split("-");
    const year = parseInt(yStr, 10);
    const month = parseInt(mStr, 10);
    const nextDate = new Date(year, month, 1);
    const ym = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}`;
    setPeriod(ym);
  };

  // Formatted active month label
  const formattedMonth = useMemo(() => {
    if (!period || !/^\d{4}-\d{2}$/.test(period)) return "Selected Month";
    const [yearStr, monthStr] = period.split("-");
    const d = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10) - 1, 1);
    return new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(d);
  }, [period]);

  // Quick Action handlers (pre-filling month date)
  const handleAddIncome = () => {
    const today = new Date().toISOString().split("T")[0];
    const initialDate = today.startsWith(period) ? today : `${period}-01`;
    openQuickAdd("INCOME", initialDate);
  };

  const handleAddExpense = () => {
    const today = new Date().toISOString().split("T")[0];
    const initialDate = today.startsWith(period) ? today : `${period}-01`;
    openQuickAdd("EXPENSE", initialDate);
  };

  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const [bRes, tRes, aRes, cRes] = await Promise.all([
        getBudgetSummaryAction(period),
        getTransactionsAction({ limit: 100 }),
        getAccountsAction(),
        getCategoriesAction(),
      ]);

      if (bRes.success && bRes.data) setBudgetSummary(bRes.data);
      if (tRes.success && tRes.data?.transactions) setTransactions(tRes.data.transactions);
      if (aRes.success && aRes.data?.accounts) setAccounts(aRes.data.accounts);
      if (cRes.success && cRes.data) setCategories(cRes.data);
    } catch (err) {
      console.error("Failed to load financial data:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [period]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Listen to global transaction created events
  useEffect(() => {
    const handleTxCreated = () => {
      loadData(true);
    };

    window.addEventListener("moneylens:transaction-created", handleTxCreated);
    return () => {
      window.removeEventListener("moneylens:transaction-created", handleTxCreated);
    };
  }, [loadData]);

  // Dynamically compute available month options from current date + transactions
  const monthOptions = useMemo(() => {
    const monthsSet = new Set<string>();

    // Current month and recent 6 months
    const now = new Date();
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthsSet.add(d.toISOString().slice(0, 7));
    }

    // Ensure currently selected period is included
    if (period) {
      monthsSet.add(period);
    }

    // Include all months present in loaded transactions
    transactions.forEach((tx) => {
      if (tx.date) {
        const ym = tx.date.slice(0, 7);
        if (/^\d{4}-\d{2}$/.test(ym)) {
          monthsSet.add(ym);
        }
      }
    });

    return Array.from(monthsSet)
      .sort((a, b) => b.localeCompare(a))
      .map((ym) => {
        const [yearStr, monthStr] = ym.split("-");
        const year = parseInt(yearStr, 10);
        const month = parseInt(monthStr, 10) - 1;
        const d = new Date(year, month, 1);
        const label = new Intl.DateTimeFormat("en-IN", {
          month: "long",
          year: "numeric",
        }).format(d);
        return { value: ym, label };
      });
  }, [period, transactions]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] w-full mx-auto animate-in fade-in duration-300">
      {/* 1. Page Header with Month Navigator & Direct Income/Expense CTAs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-card/60 backdrop-blur-xs border border-border/70 p-4 sm:p-5 rounded-2xl shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Expenses & Budgets
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              {formattedMonth}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Add monthly income, monitor category thresholds, and track daily cash burn
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Month Navigator Controls: Previous < Month Selector > Next */}
          <div className="flex items-center bg-background border border-border/80 rounded-xl p-1 shadow-xs">
            <Button
              variant="ghost"
              size="icon"
              onClick={goToPrevMonth}
              className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <div className="flex items-center gap-2 px-2.5 py-1 text-xs font-semibold text-foreground">
              <Calendar className="w-3.5 h-3.5 text-emerald-500" />
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="bg-transparent border-none text-foreground text-xs font-bold focus:outline-none cursor-pointer"
              >
                {monthOptions.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-card text-foreground">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={goToNextMonth}
              className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => loadData(true)}
            disabled={isRefreshing}
            className="h-9 w-9 rounded-xl border-border/70 cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>

          {/* + Add Income CTA ("user month wise apna paisa add karega") */}
          <Button
            size="sm"
            onClick={handleAddIncome}
            className="gap-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs px-3.5 h-9 cursor-pointer"
            title="Add income received for this month"
          >
            <TrendingUp className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>+ Add Income</span>
          </Button>

          {/* + Add Expense CTA ("fir us month k expenses add karengey") */}
          <Button
            size="sm"
            onClick={handleAddExpense}
            className="gap-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs px-3.5 h-9 cursor-pointer"
            title="Add an expense for this month"
          >
            <TrendingDown className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>+ Add Expense</span>
          </Button>
        </div>
      </div>

      {/* 2. Month Summary Banner (4 KPIs: Income, Spent, Net Savings, Pace) */}
      <SummaryBanner
        data={budgetSummary}
        period={period}
        isLoading={isLoading}
        onAddIncome={handleAddIncome}
        onAddExpense={handleAddExpense}
      />

      {/* 3. Accounts & Wallets Strip */}
      <AccountsBar accounts={accounts} onAccountAdded={() => loadData(true)} />

      {/* 4. Main Content Grid: Budgets & Ledger + Distribution Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column (2 Cols): Category Budgets + Month-Synced Transaction Ledger */}
        <div className="lg:col-span-2 space-y-6">
          {/* Category Budget Progress Bars */}
          <BudgetProgressCards
            categoriesProgress={budgetSummary?.categories || []}
            categories={categories}
            period={period}
            onBudgetUpdated={() => loadData(true)}
          />

          {/* Interactive Transactions Table */}
          <TransactionsTable
            transactions={transactions}
            accounts={accounts}
            categories={categories}
            selectedPeriod={period}
            onPeriodChange={setPeriod}
            onTransactionsChanged={() => loadData(true)}
          />
        </div>

        {/* Right Column (1 Col): Month-Specific Expense Distribution Donut Chart */}
        <div className="lg:col-span-1 space-y-6 sticky top-20">
          <ExpenseDistributionChart
            categoriesProgress={budgetSummary?.categories || []}
            transactions={transactions}
            period={period}
            onAddExpense={handleAddExpense}
          />
        </div>
      </div>
    </div>
  );
}
