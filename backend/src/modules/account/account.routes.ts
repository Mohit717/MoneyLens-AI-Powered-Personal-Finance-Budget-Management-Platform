import { Router } from "express";
import { prisma } from "../../lib/prisma.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { AccountRepository } from "./account.repository.js";
import { AccountService } from "./account.service.js";
import { AccountController } from "./account.controller.js";

export const accountRouter = Router();

const accountRepository = new AccountRepository(prisma);
const accountService = new AccountService(accountRepository);
const accountController = new AccountController(accountService);

accountRouter.get("/", authenticate, accountController.listAccounts);
accountRouter.post("/", authenticate, accountController.createAccount);
accountRouter.get("/:id", authenticate, accountController.getAccount);
accountRouter.put("/:id", authenticate, accountController.updateAccount);
accountRouter.delete("/:id", authenticate, accountController.deleteAccount);

