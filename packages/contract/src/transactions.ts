import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { apiSuccessResponseSchema, commonApiErrorResponses } from './api-response';
import { categoryIconNameSchema } from './category';

const c = initContract();

export const transactionKindSchema = z.enum(['income', 'expense', 'transfer']);

const financialAccountReferenceSchema = z.object({
  id: z.string(),
  name: z.string(),
});

const transactionCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  iconName: categoryIconNameSchema,
});

export const transactionSchema = z.object({
  id: z.string(),
  kind: transactionKindSchema,
  amountSatang: z.number().int().positive(),
  note: z.string().trim().min(1),
  transactionDate: z.iso.date(),
  createdAt: z.string(),
  sourceAccount: financialAccountReferenceSchema.nullable(),
  destinationAccount: financialAccountReferenceSchema.nullable(),
  category: transactionCategorySchema.nullable(),
});

export const listTransactionsQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional(),
  accountId: z.string().optional(),
});

export const createTransactionBodySchema = z.object({
  amountSatang: z.number().int().positive(),
  note: z.string().trim().min(1),
  transactionDate: z.iso.date(),
  sourceAccountId: z.string().nullable(),
  destinationAccountId: z.string().nullable(),
  categoryId: z.string().nullable(),
});

export const transactionContract = c.router(
  {
    list: {
      method: 'GET',
      path: '/transactions',
      query: listTransactionsQuerySchema,
      responses: {
        200: apiSuccessResponseSchema(200, z.array(transactionSchema)),
      },
    },
    create: {
      method: 'POST',
      path: '/transactions',
      body: createTransactionBodySchema,
      responses: {
        201: apiSuccessResponseSchema(201, transactionSchema),
      },
    },
  },
  {
    commonResponses: commonApiErrorResponses,
    strictStatusCodes: true,
  }
);

export type Transaction = z.infer<typeof transactionSchema>;
export type ListTransactionsQuery = z.infer<typeof listTransactionsQuerySchema>;
export type CreateTransactionBody = z.infer<typeof createTransactionBodySchema>;
