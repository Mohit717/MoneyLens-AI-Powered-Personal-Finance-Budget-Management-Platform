import { z } from "zod";

export const categoryTypeSchema = z.enum(["INCOME", "EXPENSE", "INVESTMENT"]);

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name cannot exceed 100 characters"),
  type: categoryTypeSchema,
  parentId: z.string().uuid("Invalid parent category ID").optional().nullable(),
  icon: z.string().trim().max(50).optional().nullable(),
  color: z.string().trim().max(20).optional().nullable(),
});

export const updateCategorySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name cannot exceed 100 characters").optional(),
  parentId: z.string().uuid("Invalid parent category ID").optional().nullable(),
  icon: z.string().trim().max(50).optional().nullable(),
  color: z.string().trim().max(20).optional().nullable(),
});

export const getCategoriesQuerySchema = z.object({
  type: categoryTypeSchema.optional(),
  includeSubcategories: z.enum(["true", "false"]).optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type GetCategoriesQuery = z.infer<typeof getCategoriesQuerySchema>;

