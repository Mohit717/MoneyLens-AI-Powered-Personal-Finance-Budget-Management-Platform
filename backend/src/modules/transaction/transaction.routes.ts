import { Router } from "express";
import { prisma } from "../../lib/prisma.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { TransactionRepository } from "./transaction.repository.js";
import { AccountRepository } from "../account/account.repository.js";
import { CategoryRepository } from "../category/category.repository.js";
import { TransactionService } from "./transaction.service.js";
import { TransactionController } from "./transaction.controller.js";

export const transactionRouter = Router();

const transactionRepository = new TransactionRepository(prisma);
const accountRepository = new AccountRepository(prisma);
const categoryRepository = new CategoryRepository(prisma);

const transactionService = new TransactionService(
  transactionRepository,
  accountRepository,
  categoryRepository
);
const transactionController = new TransactionController(transactionService);

transactionRouter.get("/", authenticate, transactionController.listTransactions);
transactionRouter.post("/", authenticate, transactionController.createTransaction);
transactionRouter.get("/:id", authenticate, transactionController.getTransaction);
transactionRouter.put("/:id", authenticate, transactionController.updateTransaction);
transactionRouter.delete("/:id", authenticate, transactionController.deleteTransaction);

