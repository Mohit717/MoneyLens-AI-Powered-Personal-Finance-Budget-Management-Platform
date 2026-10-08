"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Menu, Plus } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { SwitchLanguage } from "./SwitchLanguage";
import { useQuickAdd } from "@/context/quick-add-context";

interface TopbarProps {
  onOpenMobileSidebar: () => void;
}

export function Topbar({ onOpenMobileSidebar }: TopbarProps) {
  const pathname = usePathname();
  const { openQuickAdd } = useQuickAdd();

  const getPageTitle = () => {
    if (pathname === "/expenses") return "Expenses & Budgets";
    if (pathname === "/investments") return "Investments Engine";
    if (pathname === "/cashflow") return "Cashflow & Dues";
    if (pathname === "/copilot") return "AI Financial Copilot";
    if (pathname === "/settings") return "Settings & Vault";
    return "Financial Overview";
  };

  return (
    <header className="h-16 border-b border-border px-4 sm:px-6 lg:px-8 flex items-center justify-between shrink-0 sticky top-0 bg-background/95 backdrop-blur-sm z-30">
      <div className="flex items-center gap-3">
        {/* Mobile Sheet Trigger Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenMobileSidebar}
          className="lg:hidden cursor-pointer"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </Button>
        <div className="flex flex-col">
          <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground truncate">
            {getPageTitle()}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Theme Toggle (Light, Dark, System) */}
        <ThemeToggle />
        <SwitchLanguage />

        {/* 1-Click Quick Add Transaction Button accessible from any screen */}
        <Button
          size="sm"
          onClick={() => openQuickAdd("EXPENSE")}
          className="gap-1.5 sm:gap-2 text-xs font-semibold shadow-xs bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer rounded-lg px-3"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span className="hidden sm:inline">Add Expense / Income</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </div>
    </header>
  );
}
