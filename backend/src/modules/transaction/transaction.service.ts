import { TransactionType } from "../../generated/prisma/client.js";
import { AppError } from "../../middlewares/errorHandler.js";
import { AccountRepository } from "../account/account.repository.js";
import { CategoryRepository } from "../category/category.repository.js";
import {
  PaginatedTransactionsResult,
  TransactionDTO,
  TransactionRepository,
} from "./transaction.repository.js";
import {
  CreateTransactionInput,
  GetTransactionsQuery,
  UpdateTransactionInput,
} from "./transaction.schema.js";

export class TransactionService {
  constructor(
    private readonly transactionRepository: TransactionRepository,
    private readonly accountRepository: AccountRepository,
    private readonly categoryRepository: CategoryRepository
  ) {}

  async listTransactions(
    userId: string,
    query: GetTransactionsQuery
  ): Promise<PaginatedTransactionsResult> {
    return this.transactionRepository.findPaginated(userId, query);
  }

  async getTransaction(
    userId: string,
    id: string
  ): Promise<TransactionDTO> {
    const tx = await this.transactionRepository.findById(id, userId);
    if (!tx) {
      throw new AppError(404, "TRANSACTION_NOT_FOUND", "Transaction not found");
    }

    return {
      ...tx,
      amount: parseFloat(tx.amount.toString()),
    };
  }

  async createTransaction(
    userId: string,
    input: CreateTransactionInput
  ): Promise<TransactionDTO> {
    // 1. Verify source account
    const account = await this.accountRepository.findById(input.accountId, userId);
    if (!account) {
      throw new AppError(404, "ACCOUNT_NOT_FOUND", "Source account not found or access denied");
    }
    if (!account.isActive) {
      throw new AppError(400, "ACCOUNT_INACTIVE", "Cannot record transaction on an inactive account");
    }

    // 2. If transfer, verify destination account
    if (input.type === "TRANSFER") {
      if (!input.destinationAccountId) {
        throw new AppError(
          400,
          "DESTINATION_ACCOUNT_REQUIRED",
          "Destination account is required for transfers"
        );
      }
      if (input.destinationAccountId === input.accountId) {
        throw new AppError(
          400,
          "INVALID_TRANSFER",
          "Source and destination accounts must be different"
        );
      }
      const destAccount = await this.accountRepository.findById(
        input.destinationAccountId,
        userId
      );
      if (!destAccount) {
        throw new AppError(
          404,
          "DESTINATION_ACCOUNT_NOT_FOUND",
          "Destination account not found or access denied"
        );
      }
      if (!destAccount.isActive) {
        throw new AppError(
          400,
          "DESTINATION_ACCOUNT_INACTIVE",
          "Destination account is inactive"
        );
      }
    }

    // 3. Verify category if provided
    if (input.categoryId) {
      const category = await this.categoryRepository.findById(input.categoryId);
      if (!category) {
        throw new AppError(404, "CATEGORY_NOT_FOUND", "Category not found");
      }
      if (!category.isPreset && category.userId !== userId) {
        throw new AppError(403, "FORBIDDEN", "You do not have access to this category");
      }
    }

    const created = await this.transactionRepository.createWithLedgerReconciliation(
      userId,
      {
        ...input,
        date: input.date ? new Date(input.date) : new Date(),
      }
    );

    return {
      ...created,
      amount: parseFloat(created.amount.toString()),
    };
  }

  async updateTransaction(
    userId: string,
    id: string,
    input: UpdateTransactionInput
  ): Promise<TransactionDTO> {
    const existing = await this.transactionRepository.findById(id, userId);
    if (!existing) {
      throw new AppError(404, "TRANSACTION_NOT_FOUND", "Transaction not found");
    }

    const targetType = input.type || existing.type;
    const targetAccountId = input.accountId || existing.accountId;
    const targetDestAccountId =
      input.destinationAccountId !== undefined
        ? input.destinationAccountId
        : existing.destinationAccountId;

    // Verify account if changed
    if (input.accountId && input.accountId !== existing.accountId) {
      const acc = await this.accountRepository.findById(input.accountId, userId);
      if (!acc) {
        throw new AppError(404, "ACCOUNT_NOT_FOUND", "Account not found or access denied");
      }
    }

    // Verify destination account if transfer
    if (targetType === "TRANSFER") {
      if (!targetDestAccountId) {
        throw new AppError(
          400,
          "DESTINATION_ACCOUNT_REQUIRED",
          "Destination account is required for transfers"
        );
      }
      if (targetDestAccountId === targetAccountId) {
        throw new AppError(
          400,
          "INVALID_TRANSFER",
          "Source and destination accounts must be different"
        );
      }
      const destAcc = await this.accountRepository.findById(targetDestAccountId, userId);
      if (!destAcc) {
        throw new AppError(
          404,
          "DESTINATION_ACCOUNT_NOT_FOUND",
          "Destination account not found or access denied"
        );
      }
    }

    // Verify category if changed
    if (input.categoryId) {
      const cat = await this.categoryRepository.findById(input.categoryId);
      if (!cat) {
        throw new AppError(404, "CATEGORY_NOT_FOUND", "Category not found");
      }
    }

    const updated = await this.transactionRepository.updateWithLedgerReconciliation(
      userId,
      id,
      existing,
      {
        ...input,
        date: input.date ? new Date(input.date) : undefined,
      }
    );

    return {
      ...updated,
      amount: parseFloat(updated.amount.toString()),
    };
  }

  async deleteTransaction(userId: string, id: string): Promise<void> {
    const existing = await this.transactionRepository.findById(id, userId);
    if (!existing) {
      throw new AppError(404, "TRANSACTION_NOT_FOUND", "Transaction not found");
    }

    await this.transactionRepository.deleteWithLedgerReconciliation(userId, existing);
  }
}
