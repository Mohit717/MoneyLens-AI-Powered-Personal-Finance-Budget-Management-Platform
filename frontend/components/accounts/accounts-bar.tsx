"use client";

import React, { useState } from "react";
import { Account } from "@/utils/types";
import { formatINR } from "@/utils/format";
import { Building, CreditCard, Wallet, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddAccountModal } from "./add-account-modal";

interface AccountsBarProps {
  accounts: Account[];
  onAccountAdded: () => void;
}

export function AccountsBar({ accounts, onAccountAdded }: AccountsBarProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const getAccountIcon = (type: string) => {
    switch (type) {
      case "CREDIT_CARD":
        return CreditCard;
      case "CASH":
        return Wallet;
      default:
        return Building;
    }
  };

  return (
    <div className="bg-card rounded-2xl border border-border/60 p-4 shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-foreground tracking-tight">
            Accounts & Wallets
          </span>
          <span className="text-[11px] text-muted-foreground font-medium">
            ({accounts.length} active)
          </span>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsAddModalOpen(true)}
          className="h-8 gap-1.5 text-xs font-semibold rounded-xl cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Add Account</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {accounts.map((acc) => {
          const Icon = getAccountIcon(acc.type);
          const isNegative = acc.balance < 0;

          return (
            <div
              key={acc.id}
              className="p-3 rounded-xl border border-border/50 bg-background/60 hover:bg-muted/30 transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-lg bg-secondary text-secondary-foreground shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-foreground truncate">
                    {acc.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground truncate">
                    {acc.institution || (acc.type === "BANK" ? "Bank Account" : acc.type === "CASH" ? "Cash" : "Credit Card")}
                    {acc.accountNumber ? ` • ${acc.accountNumber}` : ""}
                  </span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span
                  className={`text-xs font-bold ${
                    isNegative ? "text-rose-500" : "text-foreground"
                  }`}
                >
                  {formatINR(acc.balance)}
                </span>
              </div>
            </div>
          );
        })}

        {/* Add Account Card Button */}
        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="p-3 rounded-xl border border-dashed border-border/80 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all flex items-center justify-center gap-2 text-xs font-semibold text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer min-h-[52px]"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Account</span>
        </button>
      </div>

      <AddAccountModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAccountCreated={() => onAccountAdded()}
      />
    </div>
  );
}
