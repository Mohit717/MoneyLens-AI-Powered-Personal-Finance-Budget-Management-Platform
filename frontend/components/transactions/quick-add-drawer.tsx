"use client";

import React, { useState, useEffect } from "react";
import { useQuickAdd } from "@/context/quick-add-context";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createTransactionAction,
  getAccountsAction,
  getCategoriesAction,
} from "@/app/actions/finance";
import { Account, Category, TransactionType } from "@/utils/types";
import {
  Utensils,
  Home,
  Fuel,
  ShoppingBag,
  Zap,
  HeartPulse,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Check,
  Loader2,
  Calendar,
  Building,
  CreditCard,
  Wallet,
  Plus,
} from "lucide-react";
import { AddAccountModal } from "@/components/accounts/add-account-modal";

const QUICK_CATEGORY_CHIPS = [
  { label: "Food", nameMatch: "Food", icon: Utensils, color: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
  { label: "Rent", nameMatch: "Housing", icon: Home, color: "text-blue-500 bg-blue-500/10 border-blue-500/20" },
  { label: "Fuel", nameMatch: "Transportation", icon: Fuel, color: "text-pink-500 bg-pink-500/10 border-pink-500/20" },
  { label: "Shopping", nameMatch: "Shopping", icon: ShoppingBag, color: "text-purple-500 bg-purple-500/10 border-purple-500/20" },
  { label: "Utility", nameMatch: "Utilities", icon: Zap, color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20" },
  { label: "Medical", nameMatch: "Healthcare", icon: HeartPulse, color: "text-red-500 bg-red-500/10 border-red-500/20" },
];

export function QuickAddTransactionDrawer() {
  const { isOpen, defaultType, closeQuickAdd } = useQuickAdd();

  const [type, setType] = useState<TransactionType>(defaultType);
  const [amount, setAmount] = useState<string>("");
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [selectedDestAccountId, setSelectedDestAccountId] = useState<string>("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [date, setDate] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [payee, setPayee] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sync type with defaultType when drawer opens
  useEffect(() => {
    if (isOpen) {
      setType(defaultType);
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [isOpen, defaultType]);

  // Load Accounts & Categories
  useEffect(() => {
    if (!isOpen) return;

    getAccountsAction().then((res) => {
      if (res.success && res.data?.accounts) {
        setAccounts(res.data.accounts);
        if (res.data.accounts.length > 0 && !selectedAccountId) {
          setSelectedAccountId(res.data.accounts[0].id);
        }
        if (res.data.accounts.length > 1 && !selectedDestAccountId) {
          setSelectedDestAccountId(res.data.accounts[1].id);
        }
      }
    });

    getCategoriesAction().then((res) => {
      if (res.success && res.data) {
        setCategories(res.data);
        if (!selectedCategoryId && res.data.length > 0) {
          const firstExp = res.data.find((c) => c.type === "EXPENSE");
          if (firstExp) setSelectedCategoryId(firstExp.id);
        }
      }
    });
  }, [isOpen]);

  const handleQuickAmount = (delta: number) => {
    const current = parseFloat(amount) || 0;
    setAmount(String(current + delta));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      setErrorMsg("Please enter a valid amount greater than 0");
      return;
    }

    if (!selectedAccountId) {
      setErrorMsg("Please select an account");
      return;
    }

    if (type === "TRANSFER" && (!selectedDestAccountId || selectedDestAccountId === selectedAccountId)) {
      setErrorMsg("Please choose a different destination account for transfer");
      return;
    }

    setIsLoading(true);

    try {
      const res = await createTransactionAction({
        accountId: selectedAccountId,
        destinationAccountId: type === "TRANSFER" ? selectedDestAccountId : null,
        categoryId: type !== "TRANSFER" ? selectedCategoryId || null : null,
        amount: parsedAmount,
        type,
        date: new Date(date).toISOString(),
        payee: payee.trim() || null,
        description: description.trim() || null,
      });

      console.log({res})

      if (res.success) {
        setSuccessMsg("Transaction recorded successfully!");
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("moneylens:transaction-created"));
        }
        setTimeout(() => {
          setAmount("");
          setPayee("");
          setDescription("");
          closeQuickAdd();
        }, 600);
      } else {
        setErrorMsg(res.message || "Failed to record transaction.");
      }
    } catch (err) {
      setErrorMsg("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const getAccountIcon = (accType: string) => {
    switch (accType) {
      case "CREDIT_CARD":
        return CreditCard;
      case "CASH":
        return Wallet;
      default:
        return Building;
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeQuickAdd()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md p-0 flex flex-col bg-background text-foreground border-l border-border"
      >
        <SheetHeader className="p-5 border-b border-border">
          <SheetTitle className="text-base font-bold flex items-center justify-between">
            <span>Quick-Add Transaction</span>
            <span className="text-xs font-normal text-muted-foreground">Fast Ledger Entry</span>
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* 1. Transaction Type Selector Tabs */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-muted/60 rounded-xl border border-border/50 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setType("EXPENSE");
                const expCat = categories.find((c) => c.type === "EXPENSE");
                if (expCat) setSelectedCategoryId(expCat.id);
              }}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all cursor-pointer ${
                type === "EXPENSE"
                  ? "bg-rose-500 text-white shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>Expense</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setType("INCOME");
                const incCat = categories.find((c) => c.type === "INCOME");
                if (incCat) setSelectedCategoryId(incCat.id);
              }}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all cursor-pointer ${
                type === "INCOME"
                  ? "bg-emerald-600 text-white shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Income</span>
            </button>
            <button
              type="button"
              onClick={() => setType("TRANSFER")}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all cursor-pointer ${
                type === "TRANSFER"
                  ? "bg-blue-600 text-white shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Transfer</span>
            </button>
          </div>

          {/* 2. Amount Input & Quick Chips */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground">Amount (₹)</Label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xl font-bold text-muted-foreground">
                ₹
              </span>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
                className="pl-9 text-2xl font-bold tracking-tight h-14 rounded-xl border-border bg-card shadow-xs focus-visible:ring-emerald-500"
              />
            </div>
            {/* Quick-Amount Increment Buttons */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[100, 500, 1000, 2000, 5000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleQuickAmount(val)}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border/40 transition-colors cursor-pointer"
                >
                  +₹{val >= 1000 ? `${val / 1000}k` : val}
                </button>
              ))}
              {amount && (
                <button
                  type="button"
                  onClick={() => setAmount("")}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg text-rose-500 hover:bg-rose-500/10 border border-rose-500/20 transition-colors cursor-pointer ml-auto"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* 3. Category Selection (For Expense / Income) */}
          {type !== "TRANSFER" && (
            <div className="space-y-2.5">
              <Label className="text-xs font-semibold text-muted-foreground">
                Category
              </Label>

              {/* Quick Category Chips for Expense */}
              {type === "EXPENSE" && (
                <div className="grid grid-cols-3 gap-2">
                  {QUICK_CATEGORY_CHIPS.map((chip) => {
                    const ChipIcon = chip.icon;
                    const matched = categories.find((c) =>
                      c.name.toLowerCase().includes(chip.nameMatch.toLowerCase())
                    );
                    const isSelected = matched && selectedCategoryId === matched.id;

                    return (
                      <button
                        key={chip.label}
                        type="button"
                        onClick={() => {
                          if (matched) setSelectedCategoryId(matched.id);
                        }}
                        className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all cursor-pointer text-center ${
                          isSelected
                            ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-500/10 font-bold"
                            : "border-border/60 hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <div className={`p-1.5 rounded-lg mb-1 ${chip.color}`}>
                          <ChipIcon className="w-4 h-4" />
                        </div>
                        <span className="text-xs truncate w-full">{chip.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Full Category Select Dropdown */}
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-border bg-card text-foreground text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="">-- Choose Category --</option>
                {categories
                  .filter((c) => c.type === type)
                  .map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* 4. Account Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-muted-foreground">
                {type === "TRANSFER" ? "Source Account" : "Account"}
              </Label>
              <button
                type="button"
                onClick={() => setIsAddAccountOpen(true)}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Add Account</span>
              </button>
            </div>

            {accounts.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-emerald-500/40 bg-emerald-500/5 text-center space-y-2.5">
                <div className="w-9 h-9 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">No accounts created yet</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Add a bank account or cash wallet to record this transaction.
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setIsAddAccountOpen(true)}
                  className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg cursor-pointer px-4"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Account Now
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {accounts.map((acc) => {
                  const AccIcon = getAccountIcon(acc.type);
                  const isSelected = selectedAccountId === acc.id;
                  return (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => {
                        setSelectedAccountId(acc.id);
                        if (errorMsg === "Please select an account") setErrorMsg(null);
                      }}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? "border-emerald-500 bg-emerald-500/10 text-foreground font-semibold ring-1 ring-emerald-500"
                          : "border-border/60 hover:bg-muted/40 text-muted-foreground"
                      }`}
                    >
                      <div className="p-1.5 rounded-lg bg-secondary text-secondary-foreground shrink-0">
                        <AccIcon className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs truncate font-medium text-foreground">{acc.name}</span>
                        <span className="text-[10px] text-muted-foreground">
                          ₹{acc.balance.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 4b. Destination Account for Transfers */}
          {type === "TRANSFER" && (
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground">
                Destination Account
              </Label>
              <select
                value={selectedDestAccountId}
                onChange={(e) => setSelectedDestAccountId(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-border bg-card text-foreground text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">-- Choose Destination Account --</option>
                {accounts
                  .filter((a) => a.id !== selectedAccountId)
                  .map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} (Balance: ₹{acc.balance.toLocaleString("en-IN")})
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* 5. Date & Merchant / Payee */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>Date</span>
              </Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-10 text-xs rounded-lg border-border bg-card"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">
                Payee / Merchant
              </Label>
              <Input
                type="text"
                placeholder={type === "INCOME" ? "Employer / Client" : "Swiggy, Amazon, Shell..."}
                value={payee}
                onChange={(e) => setPayee(e.target.value)}
                className="h-10 text-xs rounded-lg border-border bg-card"
              />
            </div>
          </div>

          {/* 6. Description / Notes */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">Notes / Tags</Label>
            <Input
              type="text"
              placeholder="E.g. Team dinner, Groceries for the month..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-10 text-xs rounded-lg border-border bg-card"
            />
          </div>

          {/* Alert Messages */}
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-medium">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2">
            <Button
              type="submit"
              disabled={isLoading}
              className={`w-full h-11 text-sm font-semibold rounded-xl text-white shadow-xs cursor-pointer ${
                type === "EXPENSE"
                  ? "bg-rose-600 hover:bg-rose-700"
                  : type === "INCOME"
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Recording...
                </>
              ) : (
                `Record ${type === "EXPENSE" ? "Expense" : type === "INCOME" ? "Income" : "Transfer"}`
              )}
            </Button>
          </div>
        </form>

        {/* Add Account Modal */}
        <AddAccountModal
          isOpen={isAddAccountOpen}
          onClose={() => setIsAddAccountOpen(false)}
          onAccountCreated={(newAcc) => {
            setAccounts((prev) => [...prev, newAcc]);
            setSelectedAccountId(newAcc.id);
            setErrorMsg(null);
          }}
        />
      </SheetContent>
    </Sheet>
  );
}
