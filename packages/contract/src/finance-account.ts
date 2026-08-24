import { initContract, type ServerInferRequest } from '@ts-rest/core';
import { z } from 'zod';
import { apiSuccessResponseSchema, commonApiErrorResponses } from './api-response';

const c = initContract();

const financeAccountSchema = z.object({
  id: z.string(),
  name: z.string(),
  balance: z.number(),
});

export const financeAccountContract = c.router(
  {
    list: {
      method: 'GET',
      path: '/finance-accounts',
      responses: {
        200: apiSuccessResponseSchema(200, z.array(financeAccountSchema)),
      },
    },
    create: {
      method: 'POST',
      path: '/finance-accounts',
      body: z.object({
        name: z.string(),
        balance: z.number(),
      }),
      responses: {
        200: apiSuccessResponseSchema(200, financeAccountSchema),
      },
    },
  },
  {
    commonResponses: commonApiErrorResponses,
    strictStatusCodes: true,
  }
);

export type FinanceAccountRequestSchema = ServerInferRequest<typeof financeAccountContract.create>['body'];
