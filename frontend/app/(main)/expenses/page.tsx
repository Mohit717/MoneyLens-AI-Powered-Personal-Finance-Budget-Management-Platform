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
import { Plus, RefreshCw, Calendar } from "lucide-react";

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
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Expense Ledger & Budgets
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Monitor daily cash burn, category thresholds, and double-entry transaction history
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Period Selector Dropdown */}
          <div className="flex items-center gap-2 bg-card border border-border/70 rounded-xl px-3 py-1.5 shadow-xs text-xs font-medium">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="bg-transparent border-none text-foreground text-xs font-semibold focus:outline-none cursor-pointer"
            >
              {monthOptions.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-card text-foreground">
                  {opt.label}
                </option>
              ))}
            </select>
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

          {/* Quick-Add Button */}
          <Button
            size="sm"
            onClick={() => openQuickAdd("EXPENSE")}
            className="gap-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs px-4 h-9 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Transaction</span>
          </Button>
        </div>
      </div>

      {/* 1. Summary Banner (4 KPIs) */}
      <SummaryBanner data={budgetSummary} isLoading={isLoading} />

      {/* 2. Accounts & Wallets Strip */}
      <AccountsBar accounts={accounts} onAccountAdded={() => loadData(true)} />

      {/* 3. Main Content Grid: Budgets & Ledger + Distribution Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column (2 Cols): Category Budgets + Transaction Ledger */}
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
            onTransactionsChanged={() => loadData(true)}
          />
        </div>

        {/* Right Column (1 Col): Expense Distribution Donut Chart */}
        <div className="lg:col-span-1 space-y-6 sticky top-20">
          <ExpenseDistributionChart
            categoriesProgress={budgetSummary?.categories || []}
            transactions={transactions}
          />
        </div>
      </div>
    </div>
  );
}
