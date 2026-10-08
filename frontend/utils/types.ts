export interface ActionResult<T = unknown> {
  success: boolean;
  message: string;
  user?: T;
  data?: T;
}

export interface RegisterActionInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginActionInput {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface VerifyOtpActionInput {
  email: string;
  code: string;
}

export interface ResetPasswordActionInput {
  email: string;
  code: string;
  newPassword: string;
}

export type AccountType = "BANK" | "CREDIT_CARD" | "CASH" | "INVESTMENT" | "OTHER";
export type CategoryType = "INCOME" | "EXPENSE" | "INVESTMENT";
export type TransactionType = "INCOME" | "EXPENSE" | "TRANSFER" | "INVESTMENT_ALLOCATION";

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  accountNumber?: string | null;
  institution?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AccountSummary {
  accounts: Account[];
  summary: {
    totalBalance: number;
    liquidBalance: number;
    creditDebt: number;
    investmentBalance: number;
    totalAccounts: number;
  };
}

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  parentId?: string | null;
  icon?: string | null;
  color?: string | null;
  isPreset: boolean;
  subcategories?: Category[];
}

export interface Transaction {
  id: string;
  accountId: string;
  destinationAccountId?: string | null;
  categoryId?: string | null;
  amount: number;
  type: TransactionType;
  date: string;
  payee?: string | null;
  description?: string | null;
  notes?: string | null;
  tags?: string[];
  receiptUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  account?: { id: string; name: string; type: string; currency: string };
  destinationAccount?: { id: string; name: string; type: string; currency: string } | null;
  category?: { id: string; name: string; icon: string | null; color: string | null } | null;
}

export interface PaginatedTransactions {
  transactions: Transaction[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  summary: {
    totalIncome: number;
    totalExpense: number;
    netCashFlow: number;
  };
}

export type BudgetStatus = "HEALTHY" | "WARNING" | "EXCEEDED";

export interface CategoryBudgetProgress {
  id: string;
  categoryId: string;
  category: {
    id: string;
    name: string;
    icon: string | null;
    color: string | null;
    type: string;
  };
  monthlyLimit: number;
  actualSpent: number;
  remaining: number;
  percentageUsed: number;
  status: BudgetStatus;
  rolloverEnabled: boolean;
}

export interface BudgetSummary {
  period: string;
  daysRemainingInMonth: number;
  totalDaysInMonth: number;
  categories: CategoryBudgetProgress[];
  summary: {
    totalBudgeted: number;
    totalSpentInBudgets: number;
    totalSpentOverall: number;
    totalIncome: number;
    remainingBudget: number;
    netSavings: number;
    budgetUtilizationRate: number;
  };
}

export interface CreateTransactionInput {
  accountId: string;
  destinationAccountId?: string | null;
  categoryId?: string | null;
  amount: number;
  type: TransactionType;
  date?: string;
  payee?: string | null;
  description?: string | null;
  notes?: string | null;
  tags?: string[];
  receiptUrl?: string | null;
}

export interface UpdateTransactionInput {
  accountId?: string;
  destinationAccountId?: string | null;
  categoryId?: string | null;
  amount?: number;
  type?: TransactionType;
  date?: string;
  payee?: string | null;
  description?: string | null;
  notes?: string | null;
  tags?: string[];
  receiptUrl?: string | null;
}

export interface SetBudgetInput {
  categoryId: string;
  monthlyLimit: number;
  period: string;
  rolloverEnabled?: boolean;
}