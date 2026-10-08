import { z } from "zod";

export const accountTypeSchema = z.enum([
  "BANK",
  "CREDIT_CARD",
  "CASH",
  "INVESTMENT",
  "OTHER",
]);

export const createAccountSchema = z.object({
  name: z.string().trim().min(1, "Account name is required").max(100, "Account name cannot exceed 100 characters"),
  type: accountTypeSchema.default("BANK"),
  balance: z.number().default(0),
  currency: z.string().trim().length(3, "Currency must be a 3-letter ISO code").default("INR"),
  accountNumber: z.string().trim().max(50).optional().nullable(),
  institution: z.string().trim().max(100).optional().nullable(),
});

export const updateAccountSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  type: accountTypeSchema.optional(),
  accountNumber: z.string().trim().max(50).optional().nullable(),
  institution: z.string().trim().max(100).optional().nullable(),
  isActive: z.boolean().optional(),
});

export const getAccountsQuerySchema = z.object({
  includeInactive: z.enum(["true", "false"]).optional(),
});

export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;
export type GetAccountsQuery = z.infer<typeof getAccountsQuerySchema>;

