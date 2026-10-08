import { Category, CategoryType } from "../../generated/prisma/client.js";
import { AppError } from "../../middlewares/errorHandler.js";
import { CategoryRepository } from "./category.repository.js";
import { CreateCategoryInput, UpdateCategoryInput } from "./category.schema.js";

export class CategoryService {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async listCategories(userId: string, type?: CategoryType): Promise<Category[]> {
    return this.categoryRepository.findAll(userId, type);
  }

  async getCategory(userId: string, id: string): Promise<Category> {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new AppError(404, "CATEGORY_NOT_FOUND", "Category not found");
    }

    if (!category.isPreset && category.userId !== userId) {
      throw new AppError(403, "FORBIDDEN", "You do not have access to this category");
    }

    return category;
  }

  async createCategory(userId: string, data: CreateCategoryInput): Promise<Category> {
    if (data.parentId) {
      const parent = await this.categoryRepository.findById(data.parentId);
      if (!parent) {
        throw new AppError(404, "PARENT_CATEGORY_NOT_FOUND", "Parent category does not exist");
      }
      if (parent.type !== data.type) {
        throw new AppError(
          400,
          "CATEGORY_TYPE_MISMATCH",
          `Subcategory type '${data.type}' must match parent category type '${parent.type}'`
        );
      }
      if (!parent.isPreset && parent.userId !== userId) {
        throw new AppError(403, "FORBIDDEN", "Parent category does not belong to you");
      }
    }

    return this.categoryRepository.create(userId, data);
  }

  async updateCategory(userId: string, id: string, data: UpdateCategoryInput): Promise<Category> {
    const existing = await this.categoryRepository.findById(id);
    if (!existing) {
      throw new AppError(404, "CATEGORY_NOT_FOUND", "Category not found");
    }

    if (existing.isPreset) {
      throw new AppError(400, "CANNOT_MODIFY_PRESET", "System preset categories cannot be modified");
    }

    if (existing.userId !== userId) {
      throw new AppError(403, "FORBIDDEN", "You do not have permission to modify this category");
    }

    if (data.parentId) {
      if (data.parentId === id) {
        throw new AppError(400, "INVALID_PARENT", "Category cannot be its own parent");
      }
      const parent = await this.categoryRepository.findById(data.parentId);
      if (!parent) {
        throw new AppError(404, "PARENT_CATEGORY_NOT_FOUND", "Parent category not found");
      }
      if (parent.type !== existing.type) {
        throw new AppError(
          400,
          "CATEGORY_TYPE_MISMATCH",
          `Parent category type must match category type '${existing.type}'`
        );
      }
    }

    return this.categoryRepository.update(id, data);
  }

  async deleteCategory(userId: string, id: string): Promise<Category> {
    const existing = await this.categoryRepository.findById(id);
    if (!existing) {
      throw new AppError(404, "CATEGORY_NOT_FOUND", "Category not found");
    }

    if (existing.isPreset) {
      throw new AppError(400, "CANNOT_DELETE_PRESET", "System preset categories cannot be deleted");
    }

    if (existing.userId !== userId) {
      throw new AppError(403, "FORBIDDEN", "You do not have permission to delete this category");
    }

    const txCount = await this.categoryRepository.countTransactions(id);
    if (txCount > 0) {
      throw new AppError(
        400,
        "CATEGORY_IN_USE",
        `Cannot delete category: it is assigned to ${txCount} transaction(s)`
      );
    }

    return this.categoryRepository.delete(id);
  }
}

