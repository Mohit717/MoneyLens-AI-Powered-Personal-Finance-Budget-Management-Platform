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
import Link from "next/link";
import { SummaryBanner } from "@/components/expenses/summary-banner";
import { BudgetProgressCards } from "@/components/expenses/budget-progress-cards";
import { ExpenseDistributionChart } from "@/components/expenses/expense-distribution-chart";
import { TransactionsTable } from "@/components/expenses/transactions-table";
import { AddAccountModal } from "@/components/accounts/add-account-modal";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  RefreshCw,
  Calendar,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  PiggyBank,
  Plus,
  ChevronDown,
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
  const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<"INCOME" | "EXPENSE" | "INVESTMENT_ALLOCATION" | null>(null);

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

  // Quick Action handlers (pre-filling month date, gated by account existence)
  const handleAddIncome = () => {
    if (accounts.length === 0) {
      setPendingAction("INCOME");
      setIsAddAccountModalOpen(true);
      return;
    }
    const today = new Date().toISOString().split("T")[0];
    const initialDate = today.startsWith(period) ? today : `${period}-01`;
    openQuickAdd("INCOME", initialDate);
  };

  const handleAddExpense = () => {
    if (accounts.length === 0) {
      setPendingAction("EXPENSE");
      setIsAddAccountModalOpen(true);
      return;
    }
    const today = new Date().toISOString().split("T")[0];
    const initialDate = today.startsWith(period) ? today : `${period}-01`;
    openQuickAdd("EXPENSE", initialDate);
  };

  const handleAddInvestment = () => {
    if (accounts.length === 0) {
      setPendingAction("INVESTMENT_ALLOCATION");
      setIsAddAccountModalOpen(true);
      return;
    }
    const today = new Date().toISOString().split("T")[0];
    const initialDate = today.startsWith(period) ? today : `${period}-01`;
    openQuickAdd("INVESTMENT_ALLOCATION", initialDate);
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

  // Listen to global transaction and account created events
  useEffect(() => {
    const handleTxCreated = () => {
      loadData(true);
    };
    const handleAccountCreated = () => {
      loadData(true);
    };

    window.addEventListener("moneylens:transaction-created", handleTxCreated);
    window.addEventListener("moneylens:account-created", handleAccountCreated);
    return () => {
      window.removeEventListener("moneylens:transaction-created", handleTxCreated);
      window.removeEventListener("moneylens:account-created", handleAccountCreated);
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

        <div className="flex flex-wrap items-center gap-1.5">
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

          {/* Unified Add Transaction Dropdown (Income, Investment, Expense) */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  size="sm"
                  className="gap-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs px-3.5 h-9 cursor-pointer"
                  title="Add Income, Investment, or Expense"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Add Transaction</span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-80" />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-56 p-1.5 rounded-xl border border-border shadow-lg bg-card">
              <DropdownMenuItem
                onClick={handleAddExpense}
                className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium rounded-lg cursor-pointer hover:bg-rose-500/10 text-foreground hover:text-rose-500 transition-colors"
              >
                <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500 shrink-0">
                  <TrendingDown className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-foreground">Add Expense</span>
                  <span className="text-[10px] text-muted-foreground">Daily spending & bills</span>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={handleAddInvestment}
                className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium rounded-lg cursor-pointer hover:bg-indigo-500/10 text-foreground hover:text-indigo-500 transition-colors"
              >
                <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500 shrink-0">
                  <PiggyBank className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-foreground">Add Investment</span>
                  <span className="text-[10px] text-muted-foreground">SIP, RD, NPS, Land, etc.</span>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={handleAddIncome}
                className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium rounded-lg cursor-pointer hover:bg-emerald-500/10 text-foreground hover:text-emerald-500 transition-colors"
              >
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                  <TrendingUp className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-foreground">Add Income</span>
                  <span className="text-[10px] text-muted-foreground">Salary & inflows</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Primary Financial Account Required Gate Banner */}
      {accounts.length === 0 && !isLoading && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 shrink-0 mt-0.5 sm:mt-0">
              <AlertCircle className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-foreground">
                  Primary Financial Account Required
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                  Required First Step
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
                MoneyLens operates on double-entry accounting. At least one Bank Account, Credit Card, or Cash Wallet is required before you can log monthly income or record expenses.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link href="/settings">
              <Button
                variant="outline"
                className="text-xs font-semibold rounded-xl h-9 px-3.5 gap-1.5 cursor-pointer border-amber-500/30 hover:bg-amber-500/10 text-amber-700 dark:text-amber-300"
              >
                <span>Go to Settings</span>
              </Button>
            </Link>

            <Button
              onClick={() => {
                setPendingAction(null);
                setIsAddAccountModalOpen(true);
              }}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl h-9 px-4 gap-1.5 cursor-pointer shadow-xs"
            >
              <span>+ Quick Add Account</span>
            </Button>
          </div>
        </div>
      )}

      {/* 2. Month Summary Banner (4 KPIs: Income, Spent, Net Savings, Pace) */}
      <SummaryBanner
        data={budgetSummary}
        period={period}
        isLoading={isLoading}
        onAddIncome={handleAddIncome}
        onAddExpense={handleAddExpense}
      />

      {/* 3. Main Content Grid: Budgets & Ledger + Distribution Chart */}
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

      {/* Account Setup Modal */}
      <AddAccountModal
        isOpen={isAddAccountModalOpen}
        isRequired={accounts.length === 0}
        onClose={() => {
          setIsAddAccountModalOpen(false);
          setPendingAction(null);
        }}
        onAccountCreated={(newAcc) => {
          setAccounts((prev) => [...prev, newAcc]);
          loadData(true);
          setIsAddAccountModalOpen(false);

          const target = pendingAction;
          setPendingAction(null);
          if (target) {
            const today = new Date().toISOString().split("T")[0];
            const initialDate = today.startsWith(period) ? today : `${period}-01`;
            openQuickAdd(target, initialDate);
          }
        }}
      />
    </div>
  );
}
