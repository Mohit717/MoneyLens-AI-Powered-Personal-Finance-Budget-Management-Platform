import { Router } from "express";
import { authRouter } from "./modules/auth/auth.routes.js";
import { accountRouter } from "./modules/account/account.routes.js";
import { categoryRouter } from "./modules/category/category.routes.js";
import { transactionRouter } from "./modules/transaction/transaction.routes.js";
import { budgetRouter } from "./modules/budget/budget.routes.js";

const appRoutes = Router();

appRoutes.use("/auth", authRouter);
appRoutes.use("/accounts", accountRouter);
appRoutes.use("/categories", categoryRouter);
appRoutes.use("/transactions", transactionRouter);
appRoutes.use("/budgets", budgetRouter);

export default appRoutes;