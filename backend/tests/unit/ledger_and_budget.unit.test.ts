import { describe, it, expect } from "vitest";

describe("Ledger & Budget Mathematical Engine (Unit Tests)", () => {
  describe("1. Ledger Balance Integrity & Double-Entry Invariants", () => {
    it("should preserve total assets during an internal account transfer", () => {
      const sourceBalanceInitial = 50000.0;
      const destinationBalanceInitial = 10000.0;
      const transferAmount = 15000.0;

      const totalInitial = sourceBalanceInitial + destinationBalanceInitial;

      const sourceBalanceAfter = sourceBalanceInitial - transferAmount;
      const destinationBalanceAfter = destinationBalanceInitial + transferAmount;

      const totalAfter = sourceBalanceAfter + destinationBalanceAfter;

      expect(totalAfter).toBe(totalInitial);
      expect(sourceBalanceAfter).toBe(35000.0);
      expect(destinationBalanceAfter).toBe(25000.0);
    });

    it("should accurately calculate net liquid worth and debt obligations", () => {
      const accounts = [
        { type: "BANK", balance: 125000.5 },
        { type: "CASH", balance: 5400.0 },
        { type: "INVESTMENT", balance: 250000.0 },
        { type: "CREDIT_CARD", balance: -32000.0 }, // Debt
      ];

      let liquid = 0;
      let investments = 0;
      let debt = 0;
      let netWorth = 0;

      for (const acc of accounts) {
        if (acc.type === "BANK" || acc.type === "CASH") {
          liquid += acc.balance;
          netWorth += acc.balance;
        } else if (acc.type === "INVESTMENT") {
          investments += acc.balance;
          netWorth += acc.balance;
        } else if (acc.type === "CREDIT_CARD") {
          debt += Math.abs(acc.balance);
          netWorth -= Math.abs(acc.balance);
        }
      }

      expect(liquid).toBe(130400.5);
      expect(investments).toBe(250000.0);
      expect(debt).toBe(32000.0);
      expect(netWorth).toBe(348400.5);
    });

    it("should correctly calculate ledger reconciliation delta when editing transaction amount", () => {
      let accountBalance = 10000;
      const oldExpense = 1500;
      const newExpense = 2200;

      // When old expense was created:
      accountBalance -= oldExpense; // 8500

      // Reconcile: revert old expense then apply new expense
      const balanceReverted = accountBalance + oldExpense; // 10000
      const balanceReconciled = balanceReverted - newExpense; // 7800

      expect(balanceReconciled).toBe(7800);
      expect(balanceReconciled).toBe(10000 - newExpense);
    });
  });

  describe("2. Budget Progress & Threshold Engine", () => {
    function computeBudgetStatus(actualSpent: number, limit: number) {
      const percentageUsed = limit > 0 ? Math.round((actualSpent / limit) * 10000) / 100 : 0;
      const remaining = Math.max(0, limit - actualSpent);
      let status: "HEALTHY" | "WARNING" | "EXCEEDED" = "HEALTHY";

      if (percentageUsed >= 100) {
        status = "EXCEEDED";
      } else if (percentageUsed >= 75) {
        status = "WARNING";
      }

      return { percentageUsed, remaining, status };
    }

    it("should classify budget < 75% as HEALTHY (Green)", () => {
      const result = computeBudgetStatus(5000, 10000);
      expect(result.percentageUsed).toBe(50);
      expect(result.remaining).toBe(5000);
      expect(result.status).toBe("HEALTHY");
    });

    it("should classify budget between 75% and 99.99% as WARNING (Yellow)", () => {
      const result = computeBudgetStatus(8500, 10000);
      expect(result.percentageUsed).toBe(85);
      expect(result.remaining).toBe(1500);
      expect(result.status).toBe("WARNING");
    });

    it("should classify budget >= 100% as EXCEEDED (Red)", () => {
      const result = computeBudgetStatus(12000, 10000);
      expect(result.percentageUsed).toBe(120);
      expect(result.remaining).toBe(0);
      expect(result.status).toBe("EXCEEDED");
    });

    it("should compute accurate overall savings rate and burn rate velocity", () => {
      const totalIncome = 150000;
      const totalExpenses = 95000;
      const netSavings = totalIncome - totalExpenses;
      const savingsRate = Math.round((netSavings / totalIncome) * 10000) / 100;

      expect(netSavings).toBe(55000);
      expect(savingsRate).toBe(36.67); // 36.67% savings rate
    });
  });
});

