import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { apiSuccessResponseSchema, commonApiErrorResponses } from './api-response';

const c = initContract();

export const transactionTypeSchema = z.enum(['income', 'expense', 'transfer']);
export const transactionStatusSchema = z.enum(['completed', 'pending']);

export const transactionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  bankAccountId: z.string(),
  toAccountId: z.string().nullable(), // only popualated for transfers
  categoryId: z.string().nullable(), // null for transfers
  type: transactionTypeSchema,
  amount: z.number(),
  description: z.string(),
  date: z.string(),
  status: transactionStatusSchema,
  createdAt: z.string(),
});

export const listTransactionsQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional(),
  offset: z.coerce.number().int().nonnegative().optional(),
  type: transactionTypeSchema.optional(),
  bankAccountId: z.string().optional(),
  status: transactionStatusSchema.optional(),
});

export const createTransactionBodySchema = z.object({
  type: transactionTypeSchema,
  amount: z.number().positive(),
  description: z.string().min(1),
  bankAccountId: z.string(),
  toAccountId: z.string().optional(), // required when type is 'transfer'
  categoryId: z.string().optional(), // required when type is 'income' or 'expense'
  date: z.string(),
  status: transactionStatusSchema.default('completed'),
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
