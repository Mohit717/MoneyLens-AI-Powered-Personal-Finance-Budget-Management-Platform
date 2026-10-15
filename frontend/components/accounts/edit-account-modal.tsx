"use client";

import React, { useState, useEffect } from "react";
import { updateAccountAction } from "@/app/actions/finance";
import { Account, AccountType } from "@/utils/types";
import { formatINR } from "@/utils/format";
import {
  Building,
  CreditCard,
  Wallet,
  Loader2,
  X,
  CheckCircle2,
  AlertCircle,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface EditAccountModalProps {
  isOpen: boolean;
  account: Account | null;
  onClose: () => void;
  onAccountUpdated: (account: Account) => void;
}

export function EditAccountModal({
  isOpen,
  account,
  onClose,
  onAccountUpdated,
}: EditAccountModalProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("BANK");
  const [institution, setInstitution] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (account) {
      setName(account.name || "");
      setType(account.type || "BANK");
      setInstitution(account.institution || "");
      setAccountNumber(account.accountNumber || "");
      setIsActive(account.isActive !== false);
      setErrorMsg(null);
    }
  }, [account]);

  if (!isOpen || !account) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg("Please enter an account name");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await updateAccountAction(account.id, {
        name: name.trim(),
        type,
        institution: institution.trim() || null,
        accountNumber: accountNumber.trim() || null,
        isActive,
      });

      if (res.success && res.data) {
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("moneylens:account-created", { detail: res.data })
          );
        }
        onAccountUpdated(res.data);
        onClose();
      } else {
        setErrorMsg(res.message || "Failed to update account");
      }
    } catch (err) {
      setErrorMsg("An unexpected error occurred while updating the account");
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
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Pencil className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                Edit Financial Account
              </h3>
              <p className="text-xs text-muted-foreground">
                Update account details and institution metadata
              </p>
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

        {/* Current Reconciled Balance Badge */}
        <div className="p-3 rounded-xl bg-muted/60 border border-border/70 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Reconciled Ledger Balance
            </span>
            <span className="text-[10px] text-muted-foreground">
              Updated automatically via income & expense entries
            </span>
          </div>
          <span
            className={`text-sm font-bold ${
              account.balance < 0 ? "text-rose-500" : "text-foreground"
            }`}
          >
            {formatINR(account.balance)}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Account Type Selector */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">
              Account Type
            </Label>
            <div className="grid grid-cols-3 gap-2 text-xs font-medium">
              {[
                { type: "BANK" as AccountType, label: "Bank", icon: Building },
                {
                  type: "CREDIT_CARD" as AccountType,
                  label: "Card",
                  icon: CreditCard,
                },
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
            <Label className="text-xs font-semibold text-muted-foreground">
              Account Name
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="E.g. HDFC Salary Account, ICICI Card"
              className="h-10 text-xs rounded-xl"
              required
            />
          </div>

          {/* Institution & Account Mask */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">
                Institution / Bank
              </Label>
              <Input
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="HDFC, SBI, ICICI..."
                className="h-10 text-xs rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">
                Last 4 Digits
              </Label>
              <Input
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="•••• 4892"
                className="h-10 text-xs rounded-xl"
              />
            </div>
          </div>

          {/* Active Status Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-border/70 bg-card">
            <div className="space-y-0.5">
              <Label className="text-xs font-semibold text-foreground cursor-pointer">
                Account Active
              </Label>
              <p className="text-[11px] text-muted-foreground">
                Inactive accounts are hidden from transaction pickers
              </p>
            </div>
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-border text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
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
                  Saving Changes...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

