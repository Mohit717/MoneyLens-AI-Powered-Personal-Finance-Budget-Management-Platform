import { NextFunction, Response } from "express";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware.js";
import { ResponseHandler } from "../../middlewares/responseHandler.js";
import { BudgetService } from "./budget.service.js";
import { getBudgetsQuerySchema, setBudgetSchema } from "./budget.schema.js";

export class BudgetController {
  constructor(private readonly budgetService: BudgetService) {}

  getSummary = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const query = getBudgetsQuerySchema.parse(req.query);
      const summary = await this.budgetService.getBudgetSummary(req.user!.id, query.period);

      return ResponseHandler.success({
        res,
        message: "Budget summary retrieved successfully",
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  };

  listBudgets = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const query = getBudgetsQuerySchema.parse(req.query);
      const budgets = await this.budgetService.listBudgets(req.user!.id, query.period);

      return ResponseHandler.success({
        res,
        message: "Budgets retrieved successfully",
        data: { budgets },
      });
    } catch (error) {
      next(error);
    }
  };

  setBudget = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const input = setBudgetSchema.parse(req.body);
      const budget = await this.budgetService.setBudget(req.user!.id, input);

      return ResponseHandler.success({
        res,
        statusCode: 200,
        message: "Budget set successfully",
        data: { budget },
      });
    } catch (error) {
      next(error);
    }
  };

  deleteBudget = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      await this.budgetService.deleteBudget(req.user!.id, id);

      return ResponseHandler.success({
        res,
        message: "Budget removed successfully",
      });
    } catch (error) {
      next(error);
    }
  };
}
