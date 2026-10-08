import { NextFunction, Response } from "express";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware.js";
import { ResponseHandler } from "../../middlewares/responseHandler.js";
import { TransactionService } from "./transaction.service.js";
import {
  createTransactionSchema,
  getTransactionsQuerySchema,
  updateTransactionSchema,
} from "./transaction.schema.js";

export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  listTransactions = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const query = getTransactionsQuerySchema.parse(req.query);
      const result = await this.transactionService.listTransactions(req.user!.id, query);

      return ResponseHandler.success({
        res,
        message: "Transactions retrieved successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  getTransaction = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const transaction = await this.transactionService.getTransaction(req.user!.id, id);

      return ResponseHandler.success({
        res,
        message: "Transaction retrieved successfully",
        data: { transaction },
      });
    } catch (error) {
      next(error);
    }
  };

  createTransaction = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const input = createTransactionSchema.parse(req.body);
      const transaction = await this.transactionService.createTransaction(
        req.user!.id,
        input
      );

      return ResponseHandler.created(res, "Transaction recorded successfully", {
        transaction,
      });
    } catch (error) {
      next(error);
    }
  };

  updateTransaction = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const input = updateTransactionSchema.parse(req.body);
      const transaction = await this.transactionService.updateTransaction(
        req.user!.id,
        id,
        input
      );

      return ResponseHandler.success({
        res,
        message: "Transaction updated and ledger reconciled successfully",
        data: { transaction },
      });
    } catch (error) {
      next(error);
    }
  };

  deleteTransaction = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      await this.transactionService.deleteTransaction(req.user!.id, id);

      return ResponseHandler.success({
        res,
        message: "Transaction deleted and account balance reconciled successfully",
      });
    } catch (error) {
      next(error);
    }
  };
}
