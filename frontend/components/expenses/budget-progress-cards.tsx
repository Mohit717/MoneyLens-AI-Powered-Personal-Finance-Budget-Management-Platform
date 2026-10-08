"use client";

import React, { useState } from "react";
import { Category, CategoryBudgetProgress } from "@/utils/types";
import { formatINR } from "@/utils/format";
import { setBudgetAction } from "@/app/actions/finance";
import {
  Utensils,
  Home,
  Fuel,
  ShoppingBag,
  Zap,
  HeartPulse,
  Film,
  GraduationCap,
  Plus,
  SlidersHorizontal,
  Check,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface BudgetProgressCardsProps {
  categoriesProgress: CategoryBudgetProgress[];
  categories: Category[];
  period: string;
  onBudgetUpdated: () => void;
}

export function BudgetProgressCards({
  categoriesProgress,
  categories,
  period,
  onBudgetUpdated,
}: BudgetProgressCardsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCatId, setSelectedCatId] = useState("");
  const [limitInput, setLimitInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const getCategoryIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes("food")) return Utensils;
    if (lower.includes("housing") || lower.includes("rent")) return Home;
    if (lower.includes("transport") || lower.includes("fuel")) return Fuel;
    if (lower.includes("shopping")) return ShoppingBag;
    if (lower.includes("utilit")) return Zap;
    if (lower.includes("health") || lower.includes("medical")) return HeartPulse;
    if (lower.includes("entertain")) return Film;
    if (lower.includes("educat")) return GraduationCap;
    return AlertCircle;
  };

  const handleOpenSetBudget = (catId?: string, existingLimit?: number) => {
    setSelectedCatId(catId || (categories.find((c) => c.type === "EXPENSE")?.id || ""));
    setLimitInput(existingLimit ? String(existingLimit) : "5000");
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    const limit = parseFloat(limitInput);
    if (!selectedCatId) {
      setErrorMsg("Please choose an expense category");
      return;
    }
    if (!limit || limit <= 0) {
      setErrorMsg("Please enter a budget limit greater than 0");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await setBudgetAction({
        categoryId: selectedCatId,
        monthlyLimit: limit,
        period,
        rolloverEnabled: false,
      });

      if (res.success) {
        setIsModalOpen(false);
        onBudgetUpdated();
      } else {
        setErrorMsg(res.message || "Failed to set budget limit");
      }
    } catch (err) {
      setErrorMsg("An error occurred while saving budget");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-foreground tracking-tight">
            Monthly Category Budgets
          </h2>
          <p className="text-xs text-muted-foreground">
            Track spending velocity against predefined thresholds
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleOpenSetBudget()}
          className="gap-1.5 text-xs font-semibold rounded-xl cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Set Budget</span>
        </Button>
      </div>

      {categoriesProgress.length === 0 ? (
        <div className="p-8 text-center rounded-xl border border-dashed border-border/70 space-y-3">
          <p className="text-xs text-muted-foreground">
            No budget limits set for this month yet.
          </p>
          <Button
            size="sm"
            onClick={() => handleOpenSetBudget()}
            className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg cursor-pointer"
          >
            Create Your First Budget
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {categoriesProgress.map((item) => {
            const Icon = getCategoryIcon(item.category.name);
            const isExceeded = item.percentageUsed >= 100;
            const isWarning = item.percentageUsed >= 75 && !isExceeded;

            // Visual Progress Meter Color Mapping
            const progressColor = isExceeded
              ? "bg-rose-500"
              : isWarning
              ? "bg-amber-500"
              : "bg-emerald-500";

            const badgeBg = isExceeded
              ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
              : isWarning
              ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";

            return (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-border/50 bg-background/50 hover:bg-muted/30 transition-colors space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-muted text-foreground">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-foreground block leading-tight">
                        {item.category.name}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {item.remaining > 0
                          ? `${formatINR(item.remaining, false)} remaining`
                          : `${formatINR(Math.abs(item.actualSpent - item.monthlyLimit), false)} over limit`}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeBg}`}
                    >
                      {item.status}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenSetBudget(item.categoryId, item.monthlyLimit)}
                      className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                      title="Adjust Budget"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar Container */}
                <div className="space-y-1.5">
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                      style={{ width: `${Math.min(item.percentageUsed, 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium">
                    <span>{formatINR(item.actualSpent, false)} spent</span>
                    <span>{item.percentageUsed}% of {formatINR(item.monthlyLimit, false)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Set / Adjust Budget Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border w-full max-w-sm rounded-2xl shadow-xl p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-sm font-bold text-foreground">Set Monthly Budget</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBudget} className="space-y-3.5">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">Category</Label>
                <select
                  value={selectedCatId}
                  onChange={(e) => setSelectedCatId(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-card text-foreground text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="">-- Choose Category --</option>
                  {categories
                    .filter((c) => c.type === "EXPENSE")
                    .map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">
                  Monthly Limit (₹)
                </Label>
                <Input
                  type="number"
                  step="100"
                  placeholder="E.g. 10000"
                  value={limitInput}
                  onChange={(e) => setLimitInput(e.target.value)}
                  className="h-10 text-sm font-semibold rounded-lg border-border"
                />
              </div>

              {errorMsg && (
                <div className="p-2.5 rounded-lg bg-rose-500/10 text-rose-500 text-xs font-medium border border-rose-500/20">
                  {errorMsg}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  className="text-xs cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isLoading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer rounded-lg px-4"
                >
                  {isLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    "Save Threshold"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
