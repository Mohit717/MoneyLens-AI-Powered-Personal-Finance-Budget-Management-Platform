import { z } from "zod";

export const transactionTypeSchema = z.enum([
  "INCOME",
  "EXPENSE",
  "TRANSFER",
  "INVESTMENT_ALLOCATION",
]);

export const createTransactionSchema = z
  .object({
    accountId: z.string().uuid("Invalid account ID"),
    destinationAccountId: z.string().uuid("Invalid destination account ID").optional().nullable(),
    categoryId: z.string().uuid("Invalid category ID").optional().nullable(),
    amount: z.number().positive("Amount must be greater than 0"),
    type: transactionTypeSchema,
    date: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
    payee: z.string().trim().max(100).optional().nullable(),
    description: z.string().trim().max(255).optional().nullable(),
    notes: z.string().trim().max(1000).optional().nullable(),
    tags: z.array(z.string().trim().max(50)).optional().default([]),
    receiptUrl: z.string().url("Invalid receipt URL").optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.type === "TRANSFER") {
        return !!data.destinationAccountId && data.destinationAccountId !== data.accountId;
      }
      return true;
    },
    {
      message: "Transfer requires a valid destination account different from source account",
      path: ["destinationAccountId"],
    }
  );

export const updateTransactionSchema = z
  .object({
    accountId: z.string().uuid("Invalid account ID").optional(),
    destinationAccountId: z.string().uuid("Invalid destination account ID").optional().nullable(),
    categoryId: z.string().uuid("Invalid category ID").optional().nullable(),
    amount: z.number().positive("Amount must be greater than 0").optional(),
    type: transactionTypeSchema.optional(),
    date: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
    payee: z.string().trim().max(100).optional().nullable(),
    description: z.string().trim().max(255).optional().nullable(),
    notes: z.string().trim().max(1000).optional().nullable(),
    tags: z.array(z.string().trim().max(50)).optional(),
    receiptUrl: z.string().url("Invalid receipt URL").optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.type === "TRANSFER" && data.accountId && data.destinationAccountId) {
        return data.destinationAccountId !== data.accountId;
      }
      return true;
    },
    {
      message: "Transfer destination account must be different from source account",
      path: ["destinationAccountId"],
    }
  );

export const getTransactionsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  accountId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  type: transactionTypeSchema.optional(),
  search: z.string().trim().optional(),
  sortBy: z.enum(["date", "amount"]).default("date"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
export type GetTransactionsQuery = z.infer<typeof getTransactionsQuerySchema>;

