import { Router } from "express";
import { prisma } from "../../lib/prisma.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { BudgetRepository } from "./budget.repository.js";
import { CategoryRepository } from "../category/category.repository.js";
import { BudgetService } from "./budget.service.js";
import { BudgetController } from "./budget.controller.js";

export const budgetRouter = Router();

const budgetRepository = new BudgetRepository(prisma);
const categoryRepository = new CategoryRepository(prisma);
const budgetService = new BudgetService(budgetRepository, categoryRepository);
const budgetController = new BudgetController(budgetService);

budgetRouter.get("/summary", authenticate, budgetController.getSummary);
budgetRouter.get("/", authenticate, budgetController.listBudgets);
budgetRouter.post("/", authenticate, budgetController.setBudget);
budgetRouter.delete("/:id", authenticate, budgetController.deleteBudget);

