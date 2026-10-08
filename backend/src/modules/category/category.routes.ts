import { Router } from "express";
import { prisma } from "../../lib/prisma.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { CategoryRepository } from "./category.repository.js";
import { CategoryService } from "./category.service.js";
import { CategoryController } from "./category.controller.js";

export const categoryRouter = Router();

const categoryRepository = new CategoryRepository(prisma);
const categoryService = new CategoryService(categoryRepository);
const categoryController = new CategoryController(categoryService);

categoryRouter.get("/", authenticate, categoryController.listCategories);
categoryRouter.post("/", authenticate, categoryController.createCategory);
categoryRouter.get("/:id", authenticate, categoryController.getCategory);
categoryRouter.put("/:id", authenticate, categoryController.updateCategory);
categoryRouter.delete("/:id", authenticate, categoryController.deleteCategory);

