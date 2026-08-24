import { initContract } from '@ts-rest/core';
import { z } from 'zod';

import { apiSuccessResponseSchema, commonApiErrorResponses } from './api-response';
import { categoryIconNameSchema } from './category';

const c = initContract();

const categoryExpenseMonthSchema = z.object({
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
  expenseSatang: z.number().int().nonnegative(),
});

const categoryExpenseSummarySchema = z.object({
  category: z.object({
    id: z.string(),
    name: z.string(),
    iconName: categoryIconNameSchema,
  }),
  months: z.array(categoryExpenseMonthSchema).length(12),
});

export const annualCategoryExpenseSummarySchema = z.object({
  year: z.number().int().min(1).max(9999),
  categories: z.array(categoryExpenseSummarySchema),
});

export const categoryExpenseSummaryContract = c.router(
  {
    list: {
      method: 'GET',
      path: '/category-expense-summaries',
      query: z.object({
        year: z.coerce.number().int().min(1).max(9999).optional(),
      }),
      responses: {
        200: apiSuccessResponseSchema(200, annualCategoryExpenseSummarySchema),
      },
    },
  },
  {
    commonResponses: commonApiErrorResponses,
    strictStatusCodes: true,
  }
);

export type CategoryExpenseMonth = z.infer<typeof categoryExpenseMonthSchema>;
export type AnnualCategoryExpenseSummary = z.infer<typeof annualCategoryExpenseSummarySchema>;
