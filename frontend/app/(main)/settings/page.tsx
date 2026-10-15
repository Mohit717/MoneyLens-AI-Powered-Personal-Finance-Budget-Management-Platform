"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  getAccountsAction,
  deleteAccountAction,
} from "@/app/actions/finance";
import { Account, AccountSummary } from "@/utils/types";
import { formatINR } from "@/utils/format";
import {
  Building,
  CreditCard,
  Wallet,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  ShieldCheck,
  AlertTriangle,
  Landmark,
  PiggyBank,
  CheckCircle2,
  Sliders,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddAccountModal } from "@/components/accounts/add-account-modal";
import { EditAccountModal } from "@/components/accounts/edit-account-modal";

export default function SettingsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [summary, setSummary] = useState<AccountSummary["summary"] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [deletingAccount, setDeletingAccount] = useState<Account | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Active Tab: "accounts" | "preferences"
  const [activeTab, setActiveTab] = useState<"accounts" | "preferences">("accounts");

  const loadAccounts = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const res = await getAccountsAction();
      if (res.success && res.data) {
        setAccounts(res.data.accounts || []);
        setSummary(res.data.summary || null);
      }
    } catch (err) {
      console.error("Failed to load accounts:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  // Listen to global account created/updated events
  useEffect(() => {
    const handleAccountChange = () => {
      loadAccounts(true);
    };

    window.addEventListener("moneylens:account-created", handleAccountChange);
    return () => {
      window.removeEventListener("moneylens:account-created", handleAccountChange);
    };
  }, [loadAccounts]);

  const handleDeleteAccount = async () => {
    if (!deletingAccount) return;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const res = await deleteAccountAction(deletingAccount.id);
      if (res.success) {
        setAccounts((prev) => prev.filter((a) => a.id !== deletingAccount.id));
        setDeletingAccount(null);
        loadAccounts(true);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("moneylens:account-created"));
        }
      } else {
        setDeleteError(res.message || "Failed to remove account");
      }
    } catch (err) {
      setDeleteError("An unexpected error occurred while deleting the account");
    } finally {
      setIsDeleting(false);
    }
  };

  const getAccountIcon = (type: string) => {
    switch (type) {
      case "CREDIT_CARD":
        return CreditCard;
      case "CASH":
        return Wallet;
      case "INVESTMENT":
        return PiggyBank;
      default:
        return Building;
    }
  };

  const getAccountTypeLabel = (type: string) => {
    switch (type) {
      case "CREDIT_CARD":
        return "Credit Card";
      case "CASH":
        return "Cash Wallet";
      case "INVESTMENT":
        return "Investment Account";
      default:
        return "Bank Account";
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1400px] w-full mx-auto animate-in fade-in duration-300">
      {/* 1. Header with Tab Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card/60 backdrop-blur-xs border border-border/70 p-5 rounded-2xl shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Settings & Vault
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              System & Ledger
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Manage your financial accounts, double-entry ledger entities, and system preferences
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh Action */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => loadAccounts(true)}
            disabled={isRefreshing}
            className="h-9 w-9 rounded-xl border-border/70 cursor-pointer"
            title="Refresh Accounts"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>

          {/* Add Account CTA */}
          <Button
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            className="gap-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs px-4 h-9 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add Account</span>
          </Button>
        </div>
      </div>

      {/* 2. Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-border/70 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("accounts")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "accounts"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <Landmark className="w-3.5 h-3.5" />
          <span>Financial Accounts & Wallets ({accounts.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("preferences")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "preferences"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Ledger & System Preferences</span>
        </button>
      </div>

      {/* 3. Tab Content */}
      {activeTab === "accounts" && (
        <div className="space-y-6">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-card border border-border/60 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                  Total Liquid Balance
                </span>
                <span className="text-xl sm:text-2xl font-bold tracking-tight text-foreground mt-1 block">
                  {formatINR(summary?.liquidBalance ?? accounts.filter(a => a.type !== "CREDIT_CARD").reduce((acc, a) => acc + a.balance, 0))}
                </span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                  Bank & Cash Available
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Landmark className="w-5 h-5" />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-card border border-border/60 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                  Credit Card Debt
                </span>
                <span className="text-xl sm:text-2xl font-bold tracking-tight text-rose-500 mt-1 block">
                  {formatINR(Math.abs(summary?.creditDebt ?? accounts.filter(a => a.type === "CREDIT_CARD" && a.balance < 0).reduce((acc, a) => acc + a.balance, 0)))}
                </span>
                <span className="text-[11px] text-muted-foreground font-medium">
                  Outstanding credit balance
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-500">
                <CreditCard className="w-5 h-5" />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-card border border-border/60 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                  Connected Accounts
                </span>
                <span className="text-xl sm:text-2xl font-bold tracking-tight text-foreground mt-1 block">
                  {accounts.length}
                </span>
                <span className="text-[11px] text-muted-foreground font-medium">
                  {accounts.filter(a => a.isActive !== false).length} Active in Ledger
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                <Building className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Accounts Listing Section */}
          <div className="bg-card rounded-2xl border border-border/60 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-foreground">
                  Active Financial Accounts
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  All transactions in MoneyLens reconcile against these accounts
                </p>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsAddModalOpen(true)}
                className="gap-1.5 text-xs font-semibold rounded-xl h-8 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Another Account</span>
              </Button>
            </div>

            {/* If 0 Accounts: Empty State Banner */}
            {accounts.length === 0 && !isLoading ? (
              <div className="p-8 rounded-2xl border border-dashed border-amber-500/40 bg-amber-500/5 text-center space-y-4 max-w-lg mx-auto">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto">
                  <AlertCircle className="w-7 h-7 stroke-[2]" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-foreground">
                    No Financial Accounts Found
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    MoneyLens operates as a strict double-entry ledger. Before logging your monthly income or tracking category expenses, add your primary Bank Account or Cash Wallet.
                  </p>
                </div>
                <Button
                  onClick={() => setIsAddModalOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl h-10 px-5 gap-2 cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Add First Account Now</span>
                </Button>
              </div>
            ) : (
              /* Accounts Grid */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {accounts.map((acc) => {
                  const Icon = getAccountIcon(acc.type);
                  const isNegative = acc.balance < 0;

                  return (
                    <div
                      key={acc.id}
                      className="p-4 rounded-2xl border border-border/60 bg-background/50 hover:bg-muted/20 hover:border-border transition-all flex flex-col justify-between space-y-3 shadow-xs"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2.5 rounded-xl bg-secondary text-secondary-foreground shrink-0">
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-bold text-foreground truncate">
                              {acc.name}
                            </span>
                            <span className="text-xs text-muted-foreground truncate">
                              {acc.institution || getAccountTypeLabel(acc.type)}
                              {acc.accountNumber ? ` • ${acc.accountNumber}` : ""}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                            acc.isActive !== false
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                              : "bg-muted text-muted-foreground border border-border"
                          }`}
                        >
                          {acc.isActive !== false ? "Active" : "Archived"}
                        </span>
                      </div>

                      {/* Balance & Actions */}
                      <div className="pt-2 border-t border-border/50 flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">
                            Reconciled Balance
                          </span>
                          <span
                            className={`text-base font-bold tracking-tight ${
                              isNegative ? "text-rose-500" : "text-foreground"
                            }`}
                          >
                            {formatINR(acc.balance)}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingAccount(acc)}
                            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
                            title="Edit Account"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingAccount(acc)}
                            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-rose-500 cursor-pointer"
                            title="Remove Account"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Preferences & Ledger Tab */}
      {activeTab === "preferences" && (
        <div className="bg-card rounded-2xl border border-border/60 p-6 shadow-xs space-y-6">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-foreground">
              Ledger & System Preferences
            </h2>
            <p className="text-xs text-muted-foreground">
              MoneyLens configuration and double-entry accounting standards
            </p>
          </div>

          <div className="divide-y divide-border/60 space-y-4">
            <div className="pt-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-foreground block">
                  Primary Base Currency
                </span>
                <span className="text-[11px] text-muted-foreground">
                  All accounts, reports, and charts are normalized in Indian Rupee
                </span>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-xl bg-muted border border-border/70 text-foreground">
                INR (₹)
              </span>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-foreground block">
                  Ledger Mode
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Double-entry accounting with real-time balance reconciliation
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>Strict Double-Entry Active</span>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-foreground block">
                  Authentication & Security
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Argon2id password hashing, rotating dual-token JWTs, cryptographic OTP
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                <ShieldCheck className="w-4 h-4" />
                <span>Enterprise Hardened</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Account Modal */}
      <AddAccountModal
        isOpen={isAddModalOpen}
        isRequired={accounts.length === 0}
        onClose={() => setIsAddModalOpen(false)}
        onAccountCreated={(newAcc) => {
          setAccounts((prev) => [...prev, newAcc]);
          loadAccounts(true);
        }}
      />

      {/* Edit Account Modal */}
      <EditAccountModal
        isOpen={!!editingAccount}
        account={editingAccount}
        onClose={() => setEditingAccount(null)}
        onAccountUpdated={(updatedAcc) => {
          setAccounts((prev) =>
            prev.map((a) => (a.id === updatedAcc.id ? updatedAcc : a))
          );
          loadAccounts(true);
        }}
      />

      {/* Delete Confirmation Modal */}
      {deletingAccount && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border w-full max-w-sm rounded-2xl shadow-xl p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-500">
              <div className="p-2 rounded-xl bg-rose-500/10">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-foreground">Remove Account</h3>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to remove <strong className="text-foreground">{deletingAccount.name}</strong>?
              If this account has past transactions, it will be safely archived without corrupting past ledger history.
            </p>

            {deleteError && (
              <div className="p-2.5 rounded-lg bg-rose-500/10 text-rose-500 text-xs font-medium border border-rose-500/20">
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setDeletingAccount(null)}
                className="text-xs cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={isDeleting}
                onClick={handleDeleteAccount}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer rounded-lg px-4"
              >
                {isDeleting ? "Removing..." : "Confirm Removal"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

