# 📋 MoneyLens: Project Roadmap & Task Breakdown (TASKS.md)

> **Master Execution Plan for Developers & AI Agents**  
> Tracking milestones, features, and granular tasks to build MoneyLens step-by-step.  
> As tasks are completed, change `[ ]` to `[x]`.

---

## 🏆 Milestone Overview

```
Milestone 0: Enterprise Authentication & Base UI Foundation ────────► [COMPLETED ✅]
Milestone 1: Daily/Monthly Expense & Budget Engine (Backend) ────────► [COMPLETED ✅]
Milestone 2: Expense Ledger, Budgets & Analytics (Frontend UI) ─────► [COMPLETED ✅]
Milestone 3: Cash Flow Bridge & Investible Surplus Radar ────────────► [CURRENT FOCUS 🚀]
Milestone 4: Multi-Asset Investment Engine (LIC, SKY, NPS, SIP, PF) ─► [PLANNED ⏳]
Milestone 5: Cashflow Calendar, Due-Date Sentinel & Timeline ───────► [PLANNED ⏳]
Milestone 6: AI Intelligence Layer (Gemini OCR, Copilot & Anomaly) ──► [PLANNED ⏳]
Milestone 7: Family Emergency Vault & Production Hardening ─────────► [PLANNED ⏳]
```

---

## ✅ Milestone 0: Enterprise Authentication & Base Foundation (Completed)
- [x] **0.1** PostgreSQL 16 docker-compose setup and Prisma connection check.
- [x] **0.2** User model with NFKC Unicode normalization and Argon2id password hashing.
- [x] **0.3** Dual-token JWT architecture with `jose` (15m Access Token + 7d Refresh Token in HttpOnly cookie).
- [x] **0.4** Refresh Token Rotation (RTR) with family ID theft detection and SHA-256 token hashing.
- [x] **0.5** 6-digit cryptographic OTP generation with rate-limiting, 10m expiry, and HTML mailer templates.
- [x] **0.6** Structured logging with Pino, database health probe at `/health`, and AuditLog capture.
- [x] **0.7** Automated Vitest test suite with 19/19 passing integration/unit tests.
- [x] **0.8** Next.js 16 frontend with Tailwind CSS v4, Lucide icons, Dark/Light mode theme system, and responsive sidebar.

---

## ✅ Milestone 1: Daily/Monthly Expense & Budget Engine (Backend) (Completed)
> **Goal:** Create the core financial ledger so the user can accurately record and categorize all inflows (income) and outflows (living expenses, bills, discretionary spending).

- [x] **1.1 Database Schema Extensions (Prisma)**
  - [x] Create `Account` model (e.g. Bank Account, Credit Card, Cash Wallet) with `balance`, `currency`, `accountType`.
  - [x] Create `Category` model with hierarchy (`parentId` support), `type` (INCOME, EXPENSE, INVESTMENT), and default preset icons/colors.
  - [x] Create `Transaction` model with `amount`, `date`, `type` (INCOME, EXPENSE, TRANSFER, INVESTMENT_ALLOCATION), `accountId`, `categoryId`, `tags`, `notes`, and optional receipt URL.
  - [x] Create `Budget` model with `categoryId`, `monthlyLimit`, `period` (YYYY-MM), and `rolloverEnabled`.
  - [x] Create indexes for fast filtering by `userId`, `date`, `categoryId`, and `type`.

- [x] **1.2 Expense & Income REST API Endpoints**
  - [x] `GET /api/v1/accounts` & `POST /api/v1/accounts` (Create/List financial accounts).
  - [x] `GET /api/v1/categories` & `POST /api/v1/categories` (Category tree with presets).
  - [x] `GET /api/v1/transactions` (Paginated list with date-range, category, and account filters).
  - [x] `POST /api/v1/transactions` (Create transaction with atomic balance updates).
  - [x] `PUT /api/v1/transactions/:id` & `DELETE /api/v1/transactions/:id` (Edit/delete with ledger reconciliation).
  - [x] `GET /api/v1/budgets/summary` (Compare budgeted vs actual spend for current month).
  - [x] `POST /api/v1/budgets` (Set monthly budget thresholds).

- [x] **1.3 Backend Automated Testing**
  - [x] Unit tests for ledger balance integrity (ensuring debit and credit match account balances).
  - [x] Integration tests for transaction creation, budget calculations, and unauthorized user access prevention.

---

## ✅ Milestone 2: Expense Ledger, Budgets & Analytics (Frontend UI) (Completed)
> **Goal:** Build a frictionless, high-speed UI where adding daily expenses takes under 5 seconds, and monthly budget progress is crystal clear.

- [x] **2.1 Sidebar & Navigation Update**
  - [x] Update [Sidebar.tsx](file:///d:/Development/projects/MoneyLens-AI-Powered-Personal-Finance-Budget-Management-Platform/frontend/components/Sidebar.tsx) navigation:
    - `Dashboard` (Financial Overview)
    - `Expenses & Budgets` (Daily tracker, budget bars, category breakdown)
    - `Investments` (LIC, SKY, NPS, SIP, PF)
    - `Cashflow & Dues` (Calendar & upcoming payments)
    - `AI Copilot` (Insights & Chat)
    - `Settings & Vault`

- [x] **2.2 Quick-Add Transaction Modal / Drawer**
  - [x] 1-click "Add Expense / Income" button in header accessible from any screen.
  - [x] Numeric keypad / amount input with currency symbol (₹).
  - [x] Quick-select category chips (`Food`, `Rent`, `Fuel`, `Shopping`, `Utility`, `Medical`).
  - [x] Date picker (defaulting to today) and account selector (`HDFC Bank`, `Credit Card`, `Cash`).

- [x] **2.3 Expense & Budget Page (`/expenses`)**
  - [x] **Summary Banner**: Total Income, Total Spent, Remaining Budget, and Days Left in Month.
  - [x] **Budget Progress Bars**: Visual progress meters per category (Green < 75%, Yellow 75-99%, Red ≥ 100%).
  - [x] **Interactive Transactions Table**: Search by merchant, filter by category/account, inline edit, delete confirmation.
  - [x] **Expense Distribution Chart**: Donut chart (Recharts) showing spending breakdown by top categories.

---

## 💡 Milestone 3: Cash Flow Bridge & Investible Surplus Radar (User Blueprint Integration)
> **Core Specification:** Implements the user's proven monthly spreadsheet architecture ([`USER_FINANCIAL_BLUEPRINT.md`](file:///d:/Development/projects/MoneyLens-AI-Powered-Personal-Finance-Budget-Management-Platform/USER_FINANCIAL_BLUEPRINT.md)).  
> **Goal:** Transform the user's manual monthly spreadsheet into an intelligent, automated 3-pillar engine with live "Rest" variances and real-time "SAVED THIS MONTH" surplus tracking.

- [ ] **3.1 The 65 / 20 / 15 Target Allocation Engine**
  - [ ] Auto-calculate monthly target envelopes from Monthly Income ($₹80,500$):
    - **Pillar 1: Monthly Expenses (65%)** = $₹40,250$
    - **Pillar 2: Savings & Investment (20%)** = $₹24,150$
    - **Pillar 3: Others / EMIs (15%)** = $₹16,100$
  - [ ] Allow customizable percentage rules (e.g. 65/20/15, 50/30/20, or custom).
  - [ ] Track real-time **Rest (Variance)** per pillar: `Target - Actual Spend`.

- [ ] **3.2 The 3-Pillar Monthly Dashboard & Recurring Rollover**
  - [ ] **Pillar 1 (Living Costs)**: Home Loan, Milk, Electricity, School & Van Fees, Petrol, Rasan, Veggies, Family allowances.
  - [ ] **Pillar 2 (Wealth & Protection)**: NPS, Mishika Sukanya (SKY), LIC, Recurring Deposits (RD), Weekly SIPs, Land Sinking Fund.
  - [ ] **Pillar 3 (Others & EMIs)**: Credit card settlements, Installment Loans with progress counters (e.g. `HCL GUVI 1/18` -> auto-advances to `2/18`), Occasional events.
  - [ ] **1-Click Month Rollover**: Automatically carry forward recurring commitments from previous month into the new month without manual re-typing.

- [ ] **3.3 "SAVED THIS MONTH" Net Surplus Radar & Liquid Buffer Transfer**
  - [ ] Live calculation: $\text{SAVED THIS MONTH} = \text{Income} - (\text{Pillar 1} + \text{Pillar 2} + \text{Pillar 3})$.
  - [ ] Match user's exact balance formula: $\text{Rest}_1 + \text{Rest}_2 + \text{Rest}_3 = \text{Net Surplus}$.
  - [ ] 1-Click surplus allocation to liquid reserves or wealth buffer (e.g. `Krishna Saving`).
  - [ ] Daily burn velocity: Average spend per day vs remaining budget velocity with month-end bank forecast.

---

## 📈 Milestone 4: Multi-Asset Investment Engine (LIC, SKY, NPS, SIP, PF)
> **Goal:** Modernize the user's multi-tab spreadsheet into dedicated, dynamic investment modules with accurate financial mathematics.

- [ ] **4.1 Investment Data Models & API**
  - [ ] `Investment` model with schema fields tailored for Indian instruments:
    - Policy/Account Number, Institution (`LIC of India`, `SBI MF`, `EPFO`, `Post Office`).
    - Type: `LIC_ENDOWMENT`, `SUKANYA_SAMRIDDHI`, `NPS`, `MUTUAL_FUND_SIP`, `PROVIDENT_FUND`.
    - Purchase Date, Maturity Date, Term Years, Premium Paying Term (Months/Years).
    - Premium amount, frequency, GST rates (Year 1 vs Renewal).
    - Sum Assured, Vested Bonuses, Final Additional Bonus, Expected Maturity Value.
  - [ ] `InvestmentTransaction` model linking payments directly from the `Account` expense ledger.

- [ ] **4.2 Multi-Tab Investment Hub (`/investments`)**
  - [ ] **Tab 1: LIC & Traditional Policies**
    - Digital card for **LIC Jeevan Lakshya (Plan-933)** matching user's exact sheet details.
    - Progress indicator: `Months Paid: 48 / 216`.
    - Total invested vs maturity value (₹13.37 Lakhs).
    - True IRR / XIRR calculation taking GST into account.
  - [ ] **Tab 2: SKY (Sukanya Samriddhi Yojana)**
    - Yearly deposit tracker, sovereign interest compounding, girl child milestone age (18/21 years).
  - [ ] **Tab 3: NPS (National Pension System)**
    - Tier-1 / Tier-2 breakdown, asset split (Equity E, Corporate Debt C, Govt Bonds G), tax deduction under 80CCD(1B).
  - [ ] **Tab 4: SIP (Mutual Funds & Equities)**
    - Active monthly SIP commitments, NAV tracking, equity vs hybrid asset allocation.
  - [ ] **Tab 5: PF Account (EPF / PPF)**
    - Employer + Employee contribution tracking, annual interest accrual, withdrawal eligibility rules.

- [ ] **4.3 Portfolio Summary & Net Worth Aggregator**
  - [ ] Consolidated Net Worth card: Guaranteed Assets vs Market-Linked Assets vs Cash.
  - [ ] Overall Portfolio XIRR / blended return metric.

---

## 📅 Milestone 5: Cashflow Calendar, Due-Date Sentinel & Timeline
> **Goal:** Eliminate lapsed policies and surprise deductions with an interactive maturity and premium timeline.

- [ ] **5.1 20-Year Maturity & Liquidity Horizon (Gantt View)**
  - [ ] Visual interactive timeline showing contribution years (outflows) vs maturity years (payouts).
  - [ ] Milestone markers (e.g. 2043: LIC Jeevan Lakshya payout ₹13.37 Lakhs; 2040: SKY payout).
- [ ] **5.2 Monthly Due-Date Calendar (`/cashflow`)**
  - [ ] Calendar view marking exact dates for:
    - LIC premium due dates (e.g. 11th of each month).
    - Mutual fund SIP execution dates (e.g. 5th, 10th, 15th).
    - Utility bills and credit card due dates.
  - [ ] "Mark as Paid" quick action linking the payment directly into the expense ledger.
- [ ] **5.3 Automated Reminder Alerts**
  - [ ] Email alerts 7 days and 2 days before policy due dates.
  - [ ] In-app notification center bell icon with active warnings.

---

## 🤖 Milestone 6: AI Intelligence Layer (Gemini Integration)
> **Goal:** Automate document entry and provide high-value financial intelligence.

- [ ] **6.1 Zero-Manual Policy Ingestion (OCR & Multimodal Parsing)**
  - [ ] Drag-and-drop LIC policy bond or Mutual Fund statement PDF/Image.
  - [ ] Gemini 2.5 Flash multimodal extraction: Automatically extracts Policy Name, Policy No, Term, Premium, Maturity, and Nominee.
  - [ ] Review & Confirm drawer to verify extracted numbers before saving.
- [ ] **6.2 Inflation & Purchasing Power Reality Engine**
  - [ ] AI dynamic widget comparing nominal future payouts with inflation-adjusted value:
    - *"₹13.37 Lakh in 2043 equals ~₹3.9 Lakhs at 6% inflation."*
  - [ ] Suggestions on real return hedging.
- [ ] **6.3 Conversational Financial Copilot (`/copilot`)**
  - [ ] Natural language chat interface with context over user's expenses and investments:
    - *"How much money will I receive between 2040 and 2045?"*
    - *"What happens if I increase my SIP by 10% each year?"*
    - *"What is my savings rate this month?"*
- [ ] **6.4 Cash-Crunch & Overspending Anomaly Detector**
  - [ ] Algorithmic warning when spending pace will lead to insufficient balance for upcoming policy premiums.

---

## 🛡️ Milestone 7: Family Emergency Vault & Production Hardening
> **Goal:** Provide peace of mind for families in unexpected events and ensure production reliability.

- [ ] **7.1 Emergency Family Dossier Export**
  - [ ] One-click generate password-protected PDF: Summary of all active policies, policy numbers, emergency contact numbers, bank accounts, and nominees.
  - [ ] Nominee designated emergency view.
- [ ] **7.2 End-to-End System Verification**
  - [ ] Performance and database query optimization (Prisma connection pooling).
  - [ ] Mobile responsive testing across all screens.
