import { z } from "zod";

export const setBudgetSchema = z.object({
  categoryId: z.string().uuid("Invalid category ID"),
  monthlyLimit: z.number().positive("Monthly budget limit must be greater than 0"),
  period: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Period must be in YYYY-MM format (e.g. 2026-09)"),
  rolloverEnabled: z.boolean().optional().default(false),
});

export const getBudgetsQuerySchema = z.object({
  period: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Period must be in YYYY-MM format")
    .optional(),
});

export type SetBudgetInput = z.infer<typeof setBudgetSchema>;
export type GetBudgetsQuery = z.infer<typeof getBudgetsQuerySchema>;

