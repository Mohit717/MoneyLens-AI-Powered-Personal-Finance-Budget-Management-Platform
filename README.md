# 🪙 MoneyLens: AI-Powered Personal Finance & Budget Management Platform

> An enterprise-grade, intelligent personal wealth, budgeting, and investment governance platform. Built with **Next.js (App Router, React 19, Tailwind CSS v4, Shadcn UI)**, **Node.js (Express, TypeScript, Prisma ORM, PostgreSQL)**, and **AI Financial Analytics**.

---

## 🌟 Vision & Overview

Spreadsheets like Google Sheets and Excel are great for initial tracking, but quickly fail as wealth grows:
- **No connection between daily cash flow and long-term investments**: Users often don't know how much surplus they truly have for monthly SIPs, LIC premiums, or PF deposits.
- **Inflation blind spots**: A guaranteed maturity of ₹13.37 Lakhs in 2043 (LIC Jeevan Lakshya) feels large today, but at 6% inflation, its purchasing power drops to ~₹3.9 Lakhs.
- **Manual friction & missed deadlines**: Lapsed policies, untracked interest credits, and manual copy-pasting.

**MoneyLens** bridges the gap between **daily micro-finances (expenses, bills, budgets)** and **macro-wealth management (LIC, Sukanya Samriddhi [SKY], NPS, Mutual Fund SIPs, and PF Accounts)** powered by automated cash flow modeling and AI-driven insights.

---

## 🏛️ System Architecture

```
                                  ┌───────────────────────────────┐
                                  │      Client Applications      │
                                  │  (Next.js 16 Web & Responsive)│
                                  └───────────────┬───────────────┘
                                                  │ HTTPS / REST / Cookies
                                                  ▼
                                  ┌───────────────────────────────┐
                                  │   Node.js / Express Gateway   │
                                  │ (TypeScript, Zod, Auth, Pino) │
                                  └───────┬───────────────┬───────┘
                                          │               │
                 ┌────────────────────────┴───────┐       └───────────────────────┐
                 ▼                                ▼                               ▼
   ┌───────────────────────────┐    ┌───────────────────────────┐   ┌───────────────────────────┐
   │       PostgreSQL 16       │    │     AI Intelligence       │   │    Document & Storage     │
   │        Prisma ORM         │    │  (Gemini API / LLM OCR)   │   │  (Policy PDFs & Receipts) │
   │ ───────────────────────── │    │ ───────────────────────── │   │ ───────────────────────── │
   │ • Auth & User Sessions    │    │ • Policy OCR Parsing      │   │ • Encrypted Policy Vault  │
   │ • Expense & Budget Ledger │    │ • Expense Categorization  │   │ • Statement Archives      │
   │ • Investment Registry     │    │ • Cashflow & XIRR Copilot │   │ • Nominee Emergency Pack  │
   │ • Cashflow Schedules      │    │ • Anomaly & Crunch Alert  │   │                           │
   └───────────────────────────┘    └───────────────────────────┘   └───────────────────────────┘
```

---

## 🧭 Product Strategy & "Waterfall" Financial Model

MoneyLens operates on a disciplined financial hierarchy:

```
[ Monthly Income ]
       │
       ▼
[ Step 1: Fixed Living Expenses & Bills ]  ───► (Rent, Utilities, Food, Loan EMIs)
       │
       ▼
[ Step 2: Emergency Buffer & Discretionary ] ──► (Guaranteed 3-6 month safety pool)
       │
       ▼
[ Step 3: Investible Surplus Radar ]        ───► (Calculated automatically by MoneyLens)
       │
       ├───────────────────────┬────────────────────────┬───────────────────────┐
       ▼                       ▼                        ▼                       ▼
 [ Protection & Safe ]     [ Sovereign Ret. ]      [ Market Growth ]      [ Family / Child ]
 • LIC Policies            • EPF / PPF              • Equity Mutual Funds  • Sukanya Samriddhi (SKY)
 • Health & Term Ins.      • NPS (Tier 1/2)         • Direct Stocks & SGB  • Education Funds
```

By prioritizing the **Daily/Monthly Expense & Budgeting workflow first**, users establish an unshakeable ground truth for their cash flow before locking funds into long-term investment commitments.

---

## 📊 Domain Data Models (Conceptual Draft)

### 1. Daily & Monthly Expense Ledger
* **`Account`**: Bank accounts, Credit Cards, Cash Wallets (tracks live balances).
* **`Category`**: Hierarchical categories (`Food & Dining`, `Housing`, `Utilities`, `Transportation`, `Insurance Premiums`, `Investment Contributions`).
* **`Transaction`**:
  * Type: `INCOME` | `EXPENSE` | `TRANSFER` | `INVESTMENT_ALLOCATION`
  * Amount, Currency, Date, Payment Method, Merchant, Receipt Attachment, Tags.
  * Status: `CLEARED` | `PENDING` | `RECURRING`
* **`Budget`**:
  * Monthly category spending targets (e.g. ₹15,000 for Food).
  * Rollover options and threshold alerts (at 80%, 100%, 120%).

### 2. Investment & Policy Registry
* **`Investment`**:
  * Asset Category: `INSURANCE_ENDOWMENT` (LIC), `GOVT_SAVINGS` (SKY, PPF), `RETIREMENT` (NPS, EPF), `MARKET_EQUITY` (SIP).
  * Core Metadata: Institution name, Account / Policy number, Start Date, Maturity Date.
  * Financial Terms: Sum Assured, Term (Years), Premium Paying Term (Years/Months), Frequency (Monthly/Quarterly/Annual).
  * Contribution Schedule: Amount per cycle (e.g. ₹2,260 Year 1, ₹2,210 Year 2+), Next Due Date.
  * Maturity & Bonuses: Vested Reversionary Bonus, Final Additional Bonus, Expected Maturity Value.
  * Performance Metrics: Net Invested, Current Valuation / Surrender Value, XIRR / IRR, Tax Section (80C, 10(10D), 80CCD).
* **`CashflowSchedule`**:
  * Projected outflows (premiums, SIP installments) and inflows (maturities, interest payouts) mapped across months and years.

---

## 🤖 AI Analytics & Intelligence Features

1. **Smart Transaction Parsing (OCR & SMS/Statement)**:
   - Upload receipt photos, bank CSV/PDFs, or paste transaction SMS to automatically categorize and log expenses.
2. **AI Policy Document Ingestion**:
   - Upload policy bond PDF (e.g. LIC Jeevan Lakshya) -> Gemini AI parses Policy No, Premium, Term, Maturity Date, and Nominee details with zero typing.
3. **Purchasing Power & Inflation Reality Engine**:
   - Calculates the real purchasing power of future payouts (e.g. ₹13.37 Lakhs in 2043 evaluated against 6% long-term inflation).
4. **Predictive Cash-Crunch Sentinel**:
   - Analyzes spending velocity and upcoming investment due dates to alert users 10–15 days in advance if an account faces a liquidity shortage.
5. **Conversational Financial Copilot**:
   - Natural language queries:
     - *"What will my total payouts be between 2040 and 2045?"*
     - *"Can I afford to increase my mutual fund SIP by ₹5,000 next month?"*
     - *"How much tax deduction have I utilized under Section 80C so far this fiscal year?"*

---

## 🛠️ Technology Stack

| Layer | Stack | Key Packages |
|---|---|---|
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript | `tailwindcss v4`, `lucide-react`, `recharts`, `radix-ui`, `next-themes` |
| **Backend** | Node.js, Express, TypeScript | `prisma ^5.16`, `jose`, `argon2`, `pino`, `zod`, `nodemailer` |
| **Database** | PostgreSQL 16 (Dockerized) | Relational integrity, ACID compliance, indexed financial queries |
| **AI / OCR** | Google Gemini API (Multimodal 2.5/Flash) | Document parsing, natural language analytics, anomaly detection |
| **Testing** | Vitest, Supertest | Unit, integration, and financial calculation regression testing |

---

## 🚀 Quickstart for Developers & AI Agents

### Prerequisites
- Node.js `20.x` or later
- Docker & Docker Compose (for PostgreSQL)
- npm or pnpm

### 1. Database Setup
```bash
# Start PostgreSQL 16 Alpine
docker-compose up -d
```

### 2. Backend Setup
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run dev
# Backend runs on http://localhost:5000 (Health check: http://localhost:5000/health)
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
# Frontend runs on http://localhost:3000
```

---

## 📁 Repository Structure

```
MoneyLens/
├── docker-compose.yml              # Local PostgreSQL container
├── README.md                       # Single Source of Truth for Architecture & Setup
├── TASKS.md                        # Master Milestone & Task Roadmap
├── backend/                        # Node.js + Express + Prisma API
│   ├── prisma/
│   │   └── schema.prisma           # Relational schemas (Auth, Expenses, Investments)
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/               # Enterprise JWT / RTR / OTP Security
│   │   │   ├── expenses/           # Daily/monthly expense & budget engine
│   │   │   ├── investments/        # LIC, NPS, SIP, SKY, PF portfolio registry
│   │   │   └── ai/                 # Gemini API integration & document parser
│   │   ├── config/                 # Environment & i18n configs
│   │   └── server.ts               # Express entrypoint
├── frontend/                       # Next.js 16 App Router UI
│   ├── app/
│   │   ├── (main)/
│   │   │   ├── dashboard/          # Financial cockpit & net-worth overview
│   │   │   ├── expenses/           # Daily expense log, budgets & categories
│   │   │   ├── investments/        # Multi-tab portfolio (LIC, SKY, NPS, SIP, PF)
│   │   │   ├── cashflow/           # Due-date calendar & timeline radar
│   │   │   └── copilot/            # AI conversational financial advisor
│   │   └── (auth)/                 # Login, Registration, OTP screens
│   ├── components/                 # Shadcn UI & custom finance widgets
```

---

## 🔒 Security & Privacy Guarantees
- **Zero Raw Secret Storage**: Passwords hashed via Argon2id; session tokens hashed via SHA-256.
- **Strict Data Isolation**: Every transaction, budget, and policy is scoped strictly to the authenticated `userId`.
- **Audit Logging**: Sensitive actions (large balance adjustments, policy edits) are permanently recorded in `audit_logs`.
