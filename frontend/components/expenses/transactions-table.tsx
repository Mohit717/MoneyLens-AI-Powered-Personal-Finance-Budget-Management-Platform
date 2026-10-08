"use client";

import React, { useState, useMemo } from "react";
import { Account, Category, Transaction } from "@/utils/types";
import { formatDate, formatINR } from "@/utils/format";
import { deleteTransactionAction, updateTransactionAction } from "@/app/actions/finance";
import {
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Pencil,
  Trash2,
  Calendar,
  Building,
  CreditCard,
  Wallet,
  Loader2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  List,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TransactionsTableProps {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  onTransactionsChanged: () => void;
}

interface MonthGroup {
  key: string; // "YYYY-MM"
  year: string; // "YYYY"
  monthLabel: string; // "July 2026"
  transactions: Transaction[];
  income: number;
  expense: number;
  transfers: number;
  net: number;
}

export function TransactionsTable({
  transactions,
  accounts,
  categories,
  onTransactionsChanged,
}: TransactionsTableProps) {
  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [accountFilter, setAccountFilter] = useState<string>("ALL");
  const [yearFilter, setYearFilter] = useState<string>("ALL");
  const [periodFilter, setPeriodFilter] = useState<string>("ALL"); // "ALL" or "YYYY-MM"

  // View States
  const [viewMode, setViewMode] = useState<"grouped" | "flat">("grouped");
  const [collapsedMonths, setCollapsedMonths] = useState<Record<string, boolean>>({});

  // Edit Modal State
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editPayee, setEditPayee] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete Dialog State
  const [deletingTx, setDeletingTx] = useState<Transaction | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 1. Extract all available unique years (sorted descending)
  const availableYears = useMemo(() => {
    const yearsSet = new Set<string>();
    transactions.forEach((tx) => {
      if (tx.date) {
        const y = tx.date.slice(0, 4);
        if (/^\d{4}$/.test(y)) yearsSet.add(y);
      }
    });
    return Array.from(yearsSet).sort((a, b) => b.localeCompare(a));
  }, [transactions]);

  // 2. Extract all available unique months/periods with count (sorted descending)
  const allPeriodsList = useMemo(() => {
    const map = new Map<
      string,
      { key: string; label: string; shortLabel: string; year: string; count: number }
    >();

    transactions.forEach((tx) => {
      if (tx.date) {
        const ym = tx.date.slice(0, 7);
        if (/^\d{4}-\d{2}$/.test(ym)) {
          const [yStr, mStr] = ym.split("-");
          const y = parseInt(yStr, 10);
          const m = parseInt(mStr, 10) - 1;
          const d = new Date(y, m, 1);
          const label = new Intl.DateTimeFormat("en-IN", {
            month: "long",
            year: "numeric",
          }).format(d);
          const shortLabel = new Intl.DateTimeFormat("en-IN", {
            month: "short",
            year: "numeric",
          }).format(d);

          if (!map.has(ym)) {
            map.set(ym, { key: ym, label, shortLabel, year: yStr, count: 0 });
          }
          map.get(ym)!.count++;
        }
      }
    });

    return Array.from(map.values()).sort((a, b) => b.key.localeCompare(a.key));
  }, [transactions]);

  // Visible month pills (restricted to selected year if yearFilter is active)
  const visibleMonthPills = useMemo(() => {
    if (yearFilter === "ALL") return allPeriodsList;
    return allPeriodsList.filter((p) => p.year === yearFilter);
  }, [allPeriodsList, yearFilter]);

  // 3. Filter transactions
  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      if (typeFilter !== "ALL" && tx.type !== typeFilter) return false;
      if (categoryFilter !== "ALL" && tx.categoryId !== categoryFilter) return false;
      if (
        accountFilter !== "ALL" &&
        tx.accountId !== accountFilter &&
        tx.destinationAccountId !== accountFilter
      )
        return false;

      // Year filter
      if (yearFilter !== "ALL") {
        const y = tx.date?.slice(0, 4);
        if (y !== yearFilter) return false;
      }

      // Period (Month) filter
      if (periodFilter !== "ALL") {
        const ym = tx.date?.slice(0, 7);
        if (ym !== periodFilter) return false;
      }

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchPayee = tx.payee?.toLowerCase().includes(q) || false;
        const matchDesc = tx.description?.toLowerCase().includes(q) || false;
        const matchCat = tx.category?.name.toLowerCase().includes(q) || false;
        const matchNotes = tx.notes?.toLowerCase().includes(q) || false;
        if (!matchPayee && !matchDesc && !matchCat && !matchNotes) return false;
      }

      return true;
    });
  }, [
    transactions,
    typeFilter,
    categoryFilter,
    accountFilter,
    yearFilter,
    periodFilter,
    searchTerm,
  ]);

  // 4. Group filtered transactions by Year-Month
  const monthGroups = useMemo<MonthGroup[]>(() => {
    const map = new Map<string, MonthGroup>();

    filtered.forEach((tx) => {
      const ym = tx.date?.slice(0, 7) || "Unknown";
      if (!map.has(ym)) {
        let monthLabel = "Unspecified Date";
        let year = "Other";
        if (/^\d{4}-\d{2}$/.test(ym)) {
          const [yStr, mStr] = ym.split("-");
          year = yStr;
          const d = new Date(parseInt(yStr, 10), parseInt(mStr, 10) - 1, 1);
          monthLabel = new Intl.DateTimeFormat("en-IN", {
            month: "long",
            year: "numeric",
          }).format(d);
        }

        map.set(ym, {
          key: ym,
          year,
          monthLabel,
          transactions: [],
          income: 0,
          expense: 0,
          transfers: 0,
          net: 0,
        });
      }

      const group = map.get(ym)!;
      group.transactions.push(tx);

      if (tx.type === "INCOME") {
        group.income += tx.amount;
      } else if (tx.type === "EXPENSE" || tx.type === "INVESTMENT_ALLOCATION") {
        group.expense += tx.amount;
      } else if (tx.type === "TRANSFER") {
        group.transfers += tx.amount;
      }
    });

    // Sort transactions inside each group descending by date
    for (const group of map.values()) {
      group.transactions.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      group.net = group.income - group.expense;
    }

    // Sort groups chronologically descending
    return Array.from(map.values()).sort((a, b) => b.key.localeCompare(a.key));
  }, [filtered]);

  // Collapse / Expand helpers
  const toggleCollapse = (monthKey: string) => {
    setCollapsedMonths((prev) => ({
      ...prev,
      [monthKey]: !prev[monthKey],
    }));
  };

  const expandAll = () => setCollapsedMonths({});
  const collapseAll = () => {
    const next: Record<string, boolean> = {};
    monthGroups.forEach((g) => {
      next[g.key] = true;
    });
    setCollapsedMonths(next);
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setTypeFilter("ALL");
    setCategoryFilter("ALL");
    setAccountFilter("ALL");
    setYearFilter("ALL");
    setPeriodFilter("ALL");
  };

  const getAccountIcon = (type?: string) => {
    switch (type) {
      case "CREDIT_CARD":
        return CreditCard;
      case "CASH":
        return Wallet;
      default:
        return Building;
    }
  };

  const handleStartEdit = (tx: Transaction) => {
    setEditingTx(tx);
    setEditAmount(String(tx.amount));
    setEditPayee(tx.payee || "");
    setEditDescription(tx.description || "");
    setEditDate(tx.date ? tx.date.split("T")[0] : new Date().toISOString().split("T")[0]);
    setEditCategoryId(tx.categoryId || "");
    setEditError(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTx) return;

    const parsedAmount = parseFloat(editAmount);
    if (!parsedAmount || parsedAmount <= 0) {
      setEditError("Amount must be greater than 0");
      return;
    }

    setIsEditing(true);
    setEditError(null);

    try {
      const res = await updateTransactionAction(editingTx.id, {
        amount: parsedAmount,
        payee: editPayee.trim() || null,
        description: editDescription.trim() || null,
        date: new Date(editDate).toISOString(),
        categoryId: editCategoryId || null,
      });

      if (res.success) {
        setEditingTx(null);
        onTransactionsChanged();
      } else {
        setEditError(res.message || "Failed to update transaction");
      }
    } catch {
      setEditError("An unexpected error occurred");
    } finally {
      setIsEditing(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingTx) return;
    setIsDeleting(true);

    try {
      const res = await deleteTransactionAction(deletingTx.id);
      if (res.success) {
        setDeletingTx(null);
        onTransactionsChanged();
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // Render individual transaction row
  const renderTransactionRow = (tx: Transaction) => {
    const isIncome = tx.type === "INCOME";
    const isExpense = tx.type === "EXPENSE" || tx.type === "INVESTMENT_ALLOCATION";
    const isTransfer = tx.type === "TRANSFER";
    const AccountIcon = getAccountIcon(tx.account?.type);

    return (
      <div
        key={tx.id}
        className="flex items-center justify-between p-3.5 sm:px-4 hover:bg-muted/30 transition-colors gap-3"
      >
        {/* Left: Type Icon + Details */}
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`p-2.5 rounded-xl shrink-0 ${
              isIncome
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : isExpense
                ? "bg-rose-500/10 text-rose-500"
                : "bg-blue-500/10 text-blue-500"
            }`}
          >
            {isIncome ? (
              <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
            ) : isExpense ? (
              <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />
            ) : (
              <ArrowLeftRight className="w-4 h-4 stroke-[2.5]" />
            )}
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-foreground truncate">
                {tx.payee || (isTransfer ? "Internal Transfer" : "Transaction")}
              </span>
              {tx.category && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-muted text-muted-foreground shrink-0 hidden sm:inline-block">
                  {tx.category.name}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(tx.date)}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 truncate">
                <AccountIcon className="w-3 h-3 shrink-0" />
                <span className="truncate">{tx.account?.name || "Account"}</span>
                {isTransfer && tx.destinationAccount && (
                  <span>→ {tx.destinationAccount.name}</span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Amount + Actions */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <span
              className={`text-sm font-bold block ${
                isIncome
                  ? "text-emerald-600 dark:text-emerald-400"
                  : isExpense
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-blue-600 dark:text-blue-400"
              }`}
            >
              {isIncome
                ? `+${formatINR(tx.amount)}`
                : isExpense
                ? `-${formatINR(tx.amount)}`
                : formatINR(tx.amount)}
            </span>
            <span className="text-[10px] text-muted-foreground uppercase font-medium">
              {tx.type}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleStartEdit(tx)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              title="Edit Transaction"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setDeletingTx(tx)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
              title="Delete Transaction"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-xs space-y-4">
      {/* 1. Header & Title with View Mode Toggle */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-foreground tracking-tight">
              Transaction Ledger
            </h2>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              {filtered.length} {filtered.length === 1 ? "record" : "records"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Complete record of income, expenses, and internal transfers separated by period
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle: Grouped vs Flat */}
          <div className="flex items-center gap-1 p-1 bg-muted/60 rounded-xl border border-border/50 text-xs">
            <button
              type="button"
              onClick={() => setViewMode("grouped")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all cursor-pointer font-medium ${
                viewMode === "grouped"
                  ? "bg-background text-foreground shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Group transactions by Year & Month"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>By Month</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("flat")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all cursor-pointer font-medium ${
                viewMode === "flat"
                  ? "bg-background text-foreground shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="View all transactions in a single flat list"
            >
              <List className="w-3.5 h-3.5" />
              <span>Flat List</span>
            </button>
          </div>

          {/* Expand / Collapse All (only visible in grouped mode with multiple groups) */}
          {viewMode === "grouped" && monthGroups.length > 1 && (
            <div className="flex items-center gap-1 text-xs">
              <Button
                variant="ghost"
                size="sm"
                onClick={expandAll}
                className="h-8 px-2 text-[11px] text-muted-foreground hover:text-foreground"
              >
                Expand All
              </Button>
              <span className="text-muted-foreground/40">•</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={collapseAll}
                className="h-8 px-2 text-[11px] text-muted-foreground hover:text-foreground"
              >
                Collapse All
              </Button>
            </div>
          )}

          {/* Type Filter Buttons */}
          <div className="flex items-center gap-1 p-1 bg-muted/60 rounded-xl border border-border/50 text-xs font-semibold">
            {[
              { label: "All", value: "ALL" },
              { label: "Expenses", value: "EXPENSE" },
              { label: "Income", value: "INCOME" },
              { label: "Transfers", value: "TRANSFER" },
            ].map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setTypeFilter(tab.value)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  typeFilter === tab.value
                    ? "bg-background text-foreground shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Filter Bar: Search + Year + Month/Period + Category + Account */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-1">
        {/* Search */}
        <div className="relative lg:col-span-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search payee or note..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 text-xs h-9 rounded-xl border-border bg-background"
          />
        </div>

        {/* Year Selector */}
        <select
          value={yearFilter}
          onChange={(e) => {
            const nextYear = e.target.value;
            setYearFilter(nextYear);
            if (periodFilter !== "ALL" && nextYear !== "ALL" && !periodFilter.startsWith(nextYear)) {
              setPeriodFilter("ALL");
            }
          }}
          className="h-9 px-3 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
        >
          <option value="ALL">All Years</option>
          {availableYears.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>

        {/* Period / Month Selector */}
        <select
          value={periodFilter}
          onChange={(e) => setPeriodFilter(e.target.value)}
          className="h-9 px-3 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
        >
          <option value="ALL">All Months ({yearFilter === "ALL" ? "All Time" : yearFilter})</option>
          {visibleMonthPills.map((p) => (
            <option key={p.key} value={p.key}>
              {p.label} ({p.count})
            </option>
          ))}
        </select>

        {/* Category Filter */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="h-9 px-3 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
        >
          <option value="ALL">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        {/* Account Filter */}
        <select
          value={accountFilter}
          onChange={(e) => setAccountFilter(e.target.value)}
          className="h-9 px-3 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
        >
          <option value="ALL">All Accounts</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>

      {/* 3. Quick Month Pills Strip (Instant Month Switcher) */}
      {visibleMonthPills.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 scrollbar-none text-xs">
          <button
            type="button"
            onClick={() => setPeriodFilter("ALL")}
            className={`px-3 py-1.5 rounded-xl shrink-0 font-medium transition-all cursor-pointer flex items-center gap-1.5 text-xs ${
              periodFilter === "ALL"
                ? "bg-emerald-600 text-white font-semibold shadow-xs"
                : "bg-muted/70 text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <span>All Periods</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                periodFilter === "ALL" ? "bg-black/20 text-white" : "bg-background text-muted-foreground"
              }`}
            >
              {transactions.length}
            </span>
          </button>

          {visibleMonthPills.map((p) => {
            const isSelected = periodFilter === p.key;
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => setPeriodFilter(p.key)}
                className={`px-3 py-1.5 rounded-xl shrink-0 font-medium transition-all cursor-pointer flex items-center gap-1.5 text-xs ${
                  isSelected
                    ? "bg-emerald-600 text-white font-semibold shadow-xs"
                    : "bg-muted/70 text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <span>{p.shortLabel}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected ? "bg-black/20 text-white" : "bg-background text-muted-foreground"
                  }`}
                >
                  {p.count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* 4. Transactions Content */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-border/50 p-10 text-center space-y-3">
          <p className="text-xs text-muted-foreground">
            No transactions found matching the selected filters.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetFilters}
            className="text-xs gap-1.5 cursor-pointer rounded-xl"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Filters</span>
          </Button>
        </div>
      ) : viewMode === "grouped" ? (
        /* ================= GROUPED BY YEAR & MONTH ================= */
        <div className="space-y-4">
          {monthGroups.map((group, idx) => {
            const prevGroup = monthGroups[idx - 1];
            const isNewYear = !prevGroup || prevGroup.year !== group.year;
            const isCollapsed = collapsedMonths[group.key] || false;

            return (
              <React.Fragment key={group.key}>
                {/* Year Divider (rendered when transitioning to a previous year in "All Years" view) */}
                {isNewYear && yearFilter === "ALL" && (
                  <div className="flex items-center gap-3 pt-3 pb-1">
                    <div className="h-px bg-border/80 flex-1" />
                    <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase px-2.5 py-0.5 rounded-full bg-muted/60 border border-border/50">
                      {group.year} Financial Year
                    </span>
                    <div className="h-px bg-border/80 flex-1" />
                  </div>
                )}

                {/* Month Group Card */}
                <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xs overflow-hidden transition-all shadow-xs">
                  {/* Month Header (Click to expand/collapse) */}
                  <div
                    onClick={() => toggleCollapse(group.key)}
                    className="flex flex-wrap items-center justify-between p-3 sm:px-4 bg-muted/40 hover:bg-muted/60 transition-colors cursor-pointer select-none gap-2 border-b border-border/40"
                  >
                    {/* Left: Calendar Icon + Month Title + Count */}
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-background border border-border/60 text-muted-foreground">
                        <Calendar className="w-4 h-4 text-emerald-500" />
                      </div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs sm:text-sm font-bold text-foreground">
                          {group.monthLabel}
                        </h3>
                        <span className="text-[10px] sm:text-[11px] font-medium px-2 py-0.5 rounded-full bg-muted border border-border/50 text-muted-foreground">
                          {group.transactions.length}{" "}
                          {group.transactions.length === 1 ? "transaction" : "transactions"}
                        </span>
                      </div>
                    </div>

                    {/* Right: Monthly Subtotals (Income, Expense, Net) + Chevron */}
                    <div className="flex items-center gap-2 sm:gap-2.5">
                      {group.income > 0 && (
                        <span className="text-[10px] sm:text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <ArrowUpRight className="w-3 h-3 stroke-[2.5]" />
                          +{formatINR(group.income, false)}
                        </span>
                      )}
                      {group.expense > 0 && (
                        <span className="text-[10px] sm:text-[11px] font-semibold text-rose-500 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <ArrowDownLeft className="w-3 h-3 stroke-[2.5]" />
                          -{formatINR(group.expense, false)}
                        </span>
                      )}
                      <span
                        className={`text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                          group.net > 0
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                            : group.net < 0
                            ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                            : "bg-muted text-muted-foreground border-border/50"
                        }`}
                      >
                        Net: {group.net >= 0 ? `+${formatINR(group.net, false)}` : formatINR(group.net, false)}
                      </span>

                      <div className="p-1 rounded-md text-muted-foreground hover:text-foreground">
                        {isCollapsed ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronUp className="w-4 h-4" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Month Transactions Body */}
                  {isCollapsed ? (
                    <div
                      onClick={() => toggleCollapse(group.key)}
                      className="p-3 text-center text-xs text-muted-foreground hover:bg-muted/20 cursor-pointer transition-colors"
                    >
                      {group.transactions.length} transactions collapsed • Click to expand
                    </div>
                  ) : (
                    <div className="divide-y divide-border/50">
                      {group.transactions.map((tx) => renderTransactionRow(tx))}
                    </div>
                  )}
                </div>
              </React.Fragment>
            );
          })}
        </div>
      ) : (
        /* ================= FLAT LIST VIEW ================= */
        <div className="rounded-xl border border-border/50 overflow-hidden divide-y divide-border/50">
          {filtered.map((tx) => renderTransactionRow(tx))}
        </div>
      )}

      {/* Edit Transaction Modal */}
      {editingTx && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border w-full max-w-sm rounded-2xl shadow-xl p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-sm font-bold text-foreground">Edit Transaction</h3>
              <button
                type="button"
                onClick={() => setEditingTx(null)}
                className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-muted-foreground">Amount (₹)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="h-10 text-sm font-bold"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-muted-foreground">Payee / Merchant</Label>
                <Input
                  type="text"
                  value={editPayee}
                  onChange={(e) => setEditPayee(e.target.value)}
                  className="h-10 text-xs"
                />
              </div>

              {editingTx.type !== "TRANSFER" && (
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-muted-foreground">Category</Label>
                  <select
                    value={editCategoryId}
                    onChange={(e) => setEditCategoryId(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-border bg-card text-foreground text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="">-- No Category --</option>
                    {categories
                      .filter((c) => c.type === editingTx.type)
                      .map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-muted-foreground">Date</Label>
                <Input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="h-10 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-muted-foreground">Notes</Label>
                <Input
                  type="text"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="h-10 text-xs"
                />
              </div>

              {editError && (
                <div className="p-2.5 rounded-lg bg-rose-500/10 text-rose-500 text-xs font-medium border border-rose-500/20">
                  {editError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingTx(null)}
                  className="text-xs cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isEditing}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer rounded-lg px-4"
                >
                  {isEditing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Alert Modal */}
      {deletingTx && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border w-full max-w-sm rounded-2xl shadow-xl p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-500">
              <div className="p-2 rounded-xl bg-rose-500/10">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-foreground">Delete Transaction</h3>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to delete this transaction for{" "}
              <strong className="text-foreground">{formatINR(deletingTx.amount)}</strong>?
              The account balance will be automatically restored and reconciled.
            </p>

            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setDeletingTx(null)}
                className="text-xs cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer rounded-lg px-4"
              >
                {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Confirm Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
