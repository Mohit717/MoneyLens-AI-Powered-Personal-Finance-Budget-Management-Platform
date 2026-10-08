import { NextFunction, Response } from "express";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware.js";
import { ResponseHandler } from "../../middlewares/responseHandler.js";
import { AccountService } from "./account.service.js";
import {
  createAccountSchema,
  getAccountsQuerySchema,
  updateAccountSchema,
} from "./account.schema.js";

export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  listAccounts = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const query = getAccountsQuerySchema.parse(req.query);
      const includeInactive = query.includeInactive === "true";
      const result = await this.accountService.listAccounts(req.user!.id, includeInactive);

      return ResponseHandler.success({
        res,
        message: "Accounts retrieved successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  getAccount = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const account = await this.accountService.getAccount(req.user!.id, id);

      return ResponseHandler.success({
        res,
        message: "Account retrieved successfully",
        data: { account },
      });
    } catch (error) {
      next(error);
    }
  };

  createAccount = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const input = createAccountSchema.parse(req.body);
      const account = await this.accountService.createAccount(req.user!.id, input);

      return ResponseHandler.created(res, "Account created successfully", { account });
    } catch (error) {
      next(error);
    }
  };

  updateAccount = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const input = updateAccountSchema.parse(req.body);
      const account = await this.accountService.updateAccount(req.user!.id, id, input);

      return ResponseHandler.success({
        res,
        message: "Account updated successfully",
        data: { account },
      });
    } catch (error) {
      next(error);
    }
  };

  deleteAccount = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const result = await this.accountService.deleteAccount(req.user!.id, id);

      return ResponseHandler.success({
        res,
        message: result.softDeleted
          ? "Account archived (has existing transactions)"
          : "Account deleted successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}
