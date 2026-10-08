"use client";

import React, { useState } from "react";
import { createAccountAction } from "@/app/actions/finance";
import { Account, AccountType } from "@/utils/types";
import {
  Building,
  CreditCard,
  Wallet,
  TrendingUp,
  Plus,
  Loader2,
  X,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccountCreated?: (account: Account) => void;
}

const ACCOUNT_PRESETS = [
  { label: "Salary Bank", type: "BANK" as AccountType, name: "HDFC Salary Account", institution: "HDFC Bank" },
  { label: "Savings Bank", type: "BANK" as AccountType, name: "SBI Savings Account", institution: "SBI" },
  { label: "Cash Wallet", type: "CASH" as AccountType, name: "Cash in Hand", institution: "Cash" },
  { label: "Credit Card", type: "CREDIT_CARD" as AccountType, name: "ICICI Amazon Pay Card", institution: "ICICI Bank" },
];

export function AddAccountModal({ isOpen, onClose, onAccountCreated }: AddAccountModalProps) {
  const [name, setName] = useState("HDFC Salary Account");
  const [type, setType] = useState<AccountType>("BANK");
  const [balance, setBalance] = useState("0");
  const [institution, setInstitution] = useState("HDFC Bank");
  const [accountNumber, setAccountNumber] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleApplyPreset = (preset: typeof ACCOUNT_PRESETS[0]) => {
    setName(preset.name);
    setType(preset.type);
    setInstitution(preset.institution);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg("Please enter an account name");
      return;
    }

    const parsedBalance = parseFloat(balance) || 0;
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await createAccountAction({
        name: name.trim(),
        type,
        balance: parsedBalance,
        currency: "INR",
        institution: institution.trim() || undefined,
        accountNumber: accountNumber.trim() || undefined,
      });

      if (res.success && res.data) {
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("moneylens:account-created", { detail: res.data }));
        }
        if (onAccountCreated) {
          onAccountCreated(res.data);
        }
        onClose();
      } else {
        setErrorMsg(res.message || "Failed to create account");
      }
    } catch (err) {
      setErrorMsg("An unexpected error occurred while creating the account");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-card border border-border w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Building className="w-5 h-5" />
            </div>
            <div>
              =====
              <h3 className="text-base font-bold text-foreground">Add Financial Account</h3>
              <p className="text-xs text-muted-foreground">Bank, Credit Card, or Cash Wallet</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Presets */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-muted-foreground">Quick Presets</Label>
          <div className="grid grid-cols-2 gap-2">
            {ACCOUNT_PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => handleApplyPreset(p)}
                className={`p-2 rounded-xl border text-xs font-medium text-left transition-all cursor-pointer ${
                  name === p.name && type === p.type
                    ? "border-emerald-500 bg-emerald-500/10 text-foreground font-semibold"
                    : "border-border/60 hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Account Type Selector */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">Account Type</Label>
            <div className="grid grid-cols-3 gap-2 text-xs font-medium">
              {[
                { type: "BANK" as AccountType, label: "Bank", icon: Building },
                { type: "CREDIT_CARD" as AccountType, label: "Card", icon: CreditCard },
                { type: "CASH" as AccountType, label: "Cash", icon: Wallet },
              ].map((item) => {
                const Icon = item.icon;
                const isSel = type === item.type;
                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => setType(item.type)}
                    className={`flex items-center justify-center gap-1.5 py-2 rounded-xl border transition-all cursor-pointer ${
                      isSel
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold shadow-xs"
                        : "border-border/60 text-muted-foreground hover:bg-muted/40"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Account Name */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">Account Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="E.g. HDFC Salary Account, Cash Wallet"
              className="h-10 text-xs rounded-xl"
              required
            />
          </div>

          {/* Starting Balance */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">
              Current / Starting Balance (₹)
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">
                ₹
              </span>
              <Input
                type="number"
                step="0.01"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                placeholder="0.00"
                className="pl-8 h-10 text-sm font-bold rounded-xl"
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              {type === "CREDIT_CARD"
                ? "Enter 0 or outstanding credit balance (negative or positive)"
                : "Initial starting balance for the double-entry ledger"}
            </p>
          </div>

          {/* Institution & Account Mask */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">Institution / Bank</Label>
              <Input
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="HDFC, SBI, ICICI..."
                className="h-10 text-xs rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">Last 4 Digits</Label>
              <Input
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="•••• 4892"
                className="h-10 text-xs rounded-xl"
              />
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 text-rose-500 text-xs font-medium border border-rose-500/20">
              {errorMsg}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-xs cursor-pointer rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isLoading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl px-5 h-10 cursor-pointer shadow-xs"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Creating Account...
                </>
              ) : (
                "Save Account"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
