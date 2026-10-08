import { Account } from "../../generated/prisma/client.js";
import { AppError } from "../../middlewares/errorHandler.js";
import { AccountRepository } from "./account.repository.js";
import { CreateAccountInput, UpdateAccountInput } from "./account.schema.js";

export interface AccountSummary {
  accounts: (Omit<Account, "balance"> & { balance: number })[];
  summary: {
    totalBalance: number;
    liquidBalance: number;
    creditDebt: number;
    investmentBalance: number;
    totalAccounts: number;
  };
}

export class AccountService {
  constructor(private readonly accountRepository: AccountRepository) {}

  async listAccounts(userId: string, includeInactive = false): Promise<AccountSummary> {
    const rawAccounts = await this.accountRepository.findAll(userId, includeInactive);

    let totalBalance = 0;
    let liquidBalance = 0;
    let creditDebt = 0;
    let investmentBalance = 0;

    const formattedAccounts = rawAccounts.map((acc) => {
      const balanceNum = parseFloat(acc.balance.toString());

      if (acc.isActive) {
        if (acc.type === "BANK" || acc.type === "CASH") {
          liquidBalance += balanceNum;
          totalBalance += balanceNum;
        } else if (acc.type === "INVESTMENT") {
          investmentBalance += balanceNum;
          totalBalance += balanceNum;
        } else if (acc.type === "CREDIT_CARD") {
          // If credit card has outstanding balance (often tracked as positive liability or negative)
          creditDebt += Math.abs(balanceNum);
          totalBalance -= Math.abs(balanceNum);
        } else {
          totalBalance += balanceNum;
        }
      }

      return {
        ...acc,
        balance: balanceNum,
      };
    });

    return {
      accounts: formattedAccounts,
      summary: {
        totalBalance: Math.round(totalBalance * 100) / 100,
        liquidBalance: Math.round(liquidBalance * 100) / 100,
        creditDebt: Math.round(creditDebt * 100) / 100,
        investmentBalance: Math.round(investmentBalance * 100) / 100,
        totalAccounts: rawAccounts.length,
      },
    };
  }

  async getAccount(userId: string, id: string): Promise<Omit<Account, "balance"> & { balance: number; transactions: any[] }> {
    const account = await this.accountRepository.findById(id, userId);
    if (!account) {
      throw new AppError(404, "ACCOUNT_NOT_FOUND", "Account not found");
    }

    return {
      ...account,
      balance: parseFloat(account.balance.toString()),
      transactions: (account as any).transactions || [],
    };
  }

  async createAccount(userId: string, data: CreateAccountInput): Promise<Omit<Account, "balance"> & { balance: number }> {
    const account = await this.accountRepository.create(userId, data);
    return {
      ...account,
      balance: parseFloat(account.balance.toString()),
    };
  }

  async updateAccount(userId: string, id: string, data: UpdateAccountInput): Promise<Omit<Account, "balance"> & { balance: number }> {
    const existing = await this.accountRepository.findById(id, userId);
    if (!existing) {
      throw new AppError(404, "ACCOUNT_NOT_FOUND", "Account not found");
    }

    const updated = await this.accountRepository.update(id, userId, data);
    return {
      ...updated,
      balance: parseFloat(updated.balance.toString()),
    };
  }

  async deleteAccount(userId: string, id: string): Promise<{ deleted: boolean; softDeleted: boolean }> {
    const existing = await this.accountRepository.findById(id, userId);
    if (!existing) {
      throw new AppError(404, "ACCOUNT_NOT_FOUND", "Account not found");
    }

    const txCount = await this.accountRepository.countTransactions(id);
    if (txCount > 0) {
      await this.accountRepository.softDelete(id, userId);
      return { deleted: false, softDeleted: true };
    }

    await this.accountRepository.delete(id, userId);
    return { deleted: true, softDeleted: false };
  }
}

