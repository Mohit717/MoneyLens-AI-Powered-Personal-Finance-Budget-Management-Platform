# MoneyLens: Core User Financial Architecture & Monthly Blueprint

This document records the exact monthly personal finance model used by the platform owner (from their real-world monthly Google Sheet). All modules, budget calculations, cash flow engines, and categorization logic in MoneyLens are grounded in this system.

---

## 1. Income & Allocation Rule: The 65 / 20 / 15 Engine

Every month starts with **Monthly Income** (e.g., ₹80,500).
The income is programmatically split into 3 target envelopes:

1. **Monthly Expenses (65%)** = `Income × 0.65` (e.g. ₹40,250)
2. **Savings & Investment (20%)** = `Income × 0.20` (e.g. ₹24,150)
3. **Other Expenses & EMIs (15%)** = `Income × 0.15` (e.g. ₹16,100)

Total Targets: 65% + 20% + 15% = 100%

---

## 2. Pillar 1: Monthly Essential Expenses (Target: 65%)

Essential family living costs, mortgage EMI, child education, and household groceries:

| Line Item | Category | Nature | Amount (₹) |
|:---|:---|:---|:---|
| **Home Loan** | Housing / Mortgage EMI | Fixed Commitment | 12,130 |
| **Milk** | Food & Dairy | Essential Recurring | 2,800 |
| **Electricity (ICICI CC)** | Utilities (via Credit Card) | Recurring Bill | 1,188 |
| **Mishika Fee** | Education / Tuition | Essential Child Cost | 3,450 |
| **Petrol** | Transportation / Fuel | Variable Essential | 2,000 |
| **Rasan** | Groceries & Household | Essential Living | 3,000 |
| **Vegitables** | Fresh Produce | Variable Essential | 2,000 |
| **Mummy** | Family Support | Parents Allowance | 2,000 |
| **Personal** | Personal Cash | Discretionary Pocket Money | 1,000 |
| **Mishi Van** | School Transportation | Child Commute | 1,300 |
| **Priti Personal** | Family Allowance | Spouse Discretionary | 1,000 |
| **Total Expenses** | | | **₹31,868** |
| **Rest (Variance)** | `65% Target (40,250) - Actual (31,868)` | **Surplus Under Budget** | **+₹8,382** |

---

## 3. Pillar 2: Savings & Investment (Target: 20%)

Long-term wealth creation, child future security, insurance, and asset purchase goals:

| Line Item | Investment Instrument | Goal | Amount (₹) |
|:---|:---|:---|:---|
| **NPS** | National Pension System | Retirement Corpus | 1,000 |
| **Mishika SKY** | Sukanya Samriddhi Yojana | Child Future Fund | 3,000 |
| **LIC** | Life Insurance Policy | Family Risk Protection | 2,260 |
| **RD Priti** | Recurring Deposit | Guaranteed Bank Savings | 1,000 |
| **SIP 100/per week** | Weekly Equity SIP #1 | Compounding Wealth | 100 |
| **SIP 100/per week** | Weekly Equity SIP #2 | Compounding Wealth | 100 |
| **SIP 100/per week** | Weekly Equity SIP #3 | Compounding Wealth | 100 |
| **SIP 100/per week** | Weekly Equity SIP #4 | Compounding Wealth | 100 |
| **SIP 100/per week** | Weekly Equity SIP #5 | Compounding Wealth | 100 |
| **Priti TI** | Term Insurance / Fund | Family Protection | 1,000 |
| **EMG FUND (RD)** | Emergency Reserve | Rainy Day Liquidity | 0 (Active goal) |
| **Home Loan Prepayment SIP** | Debt Prepayment SIP | Mortgage Reduction | 0 (Active goal) |
| **For Land** | Real Estate Sinking Fund | Capital Asset Acquisition | 20,000 |
| **Total Investments** | | | **₹27,760** |
| **Rest (Variance)** | `20% Target (24,150) - Actual (27,760)` | **Invested Above Target** | **-₹3,610** |

---

## 4. Pillar 3: Others / EMIs / Ad-Hoc (Target: 15%)

Credit card dues, installment loans, and celebration / irregular expenses:

| Line Item | Type | Details | Amount (₹) |
|:---|:---|:---|:---|
| **Prev Electricity ICICI CC** | Credit Card Clearance | Previous period settlement | 1,831 |
| **HCL GUVI 1/18** | Education / Course EMI | Installment 1 of 18 | 5,000 |
| **HCL GUVI REG (SBI CC)** | Card Transaction | Course registration fee | 999 |
| **Mishika Bday** | Occasional Expense | Birthday celebration | 3,000 |
| **HCL GUVI 2/18** | Education / Course EMI | Installment 2 of 18 | 4,864 |
| **Papa Recharge** | Family Utility | Mobile phone recharge | 799 |
| **Total Others** | | | **₹16,493** |
| **Rest (Variance)** | `15% Target (16,100) - Actual (16,493)` | **Variance** | **-₹393** |

---

## 5. Month-End Bottom Line & Surplus Formula

$$\text{Total Monthly Income} = ₹80,500$$
$$\text{Total Outflows} = 31,868 + 27,760 + 16,493 = ₹76,121$$
$$\textbf{SAVED THIS MONTH (Net Surplus)} = ₹80,500 - ₹76,121 = \textbf{₹4,379}$$

$$\text{Alternative Check: } \text{Rest}_1 (8,382) + \text{Rest}_2 (-3,610) + \text{Rest}_3 (-393) = \textbf{₹4,379}$$

**Pending Allocation**: `Krishna Saving` (Liquid wealth accumulation / buffer).

---

## 6. How MoneyLens Implements This System

1. **Monthly Income Input**:
   - User inputs their monthly income (e.g. ₹80,500).
   - The platform calculates the 65 / 20 / 15 budget targets.
2. **3-Pillar Budget Trackers**:
   - Real-time gauge for Pillar 1 (Essential Living), Pillar 2 (Savings & Investments), and Pillar 3 (Others/EMIs).
   - Shows live `Total Spent`, `Target Limit`, and `Rest` variance.
3. **Recurring Commitment Rollover**:
   - Fixed recurring items (*Home Loan, Milk, School Fees, Rasan, SIPs, LIC, NPS*) auto-populate each month so the user doesn't re-type them manually.
4. **EMI & Installment Counter**:
   - `HCL GUVI 1/18` -> auto-increments to `2/18` next month, with remaining balance and payoff date.
5. **Goal Sinking Funds**:
   - `For Land: ₹20,000` tracks lifetime progress towards the land purchase goal.
6. **Prominent "SAVED THIS MONTH" Green Bar**:
   - Displays net monthly surplus with 1-click action to assign to `Krishna Saving` or Emergency Fund.
7. **Month-by-Month Tab Navigation**:
   - Directly mirrors the user's `JAN` through `DEC` sheet tabs for historical comparison and velocity tracking.

