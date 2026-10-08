import { NextFunction, Response } from "express";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware.js";
import { ResponseHandler } from "../../middlewares/responseHandler.js";
import { CategoryService } from "./category.service.js";
import {
  createCategorySchema,
  getCategoriesQuerySchema,
  updateCategorySchema,
} from "./category.schema.js";

export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  listCategories = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const query = getCategoriesQuerySchema.parse(req.query);
      const categories = await this.categoryService.listCategories(
        req.user!.id,
        query.type
      );

      return ResponseHandler.success({
        res,
        message: "Categories fetched successfully",
        data: { categories },
      });
    } catch (error) {
      next(error);
    }
  };

  getCategory = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const category = await this.categoryService.getCategory(req.user!.id, id);

      return ResponseHandler.success({
        res,
        message: "Category fetched successfully",
        data: { category },
      });
    } catch (error) {
      next(error);
    }
  };

  createCategory = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const input = createCategorySchema.parse(req.body);
      const category = await this.categoryService.createCategory(req.user!.id, input);

      return ResponseHandler.created(res, "Category created successfully", { category });
    } catch (error) {
      next(error);
    }
  };

  updateCategory = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const input = updateCategorySchema.parse(req.body);
      const category = await this.categoryService.updateCategory(
        req.user!.id,
        id,
        input
      );

      return ResponseHandler.success({
        res,
        message: "Category updated successfully",
        data: { category },
      });
    } catch (error) {
      next(error);
    }
  };

  deleteCategory = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      await this.categoryService.deleteCategory(req.user!.id, id);

      return ResponseHandler.success({
        res,
        message: "Category deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  };
}
