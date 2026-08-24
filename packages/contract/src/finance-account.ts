import { initContract, type ServerInferRequest } from '@ts-rest/core';
import { z } from 'zod';
import { apiErrorResponseSchema, apiSuccessResponseSchema, commonApiErrorResponses } from './api-response';

const c = initContract();

export const financialAccountSummarySchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1),
  currency: z.literal('THB'),
  openingBalanceSatang: z.number().int(),
  currentBalanceSatang: z.number().int(),
  createdAt: z.string(),
});

export const financeAccountContract = c.router(
  {
    list: {
      method: 'GET',
      path: '/finance-accounts',
      responses: {
        200: apiSuccessResponseSchema(200, z.array(financialAccountSummarySchema)),
      },
    },
    create: {
      method: 'POST',
      path: '/finance-accounts',
      body: z.object({
        name: z.string().trim().min(1).max(100),
        openingBalanceSatang: z.number().int().default(0),
      }),
      responses: {
        200: apiSuccessResponseSchema(200, financialAccountSummarySchema),
        409: apiErrorResponseSchema(409),
      },
    },
  },
  {
    commonResponses: commonApiErrorResponses,
    strictStatusCodes: true,
  }
);

export type FinancialAccountSummary = z.infer<typeof financialAccountSummarySchema>;
export type CreateFinancialAccountBody = ServerInferRequest<typeof financeAccountContract.create>['body'];
