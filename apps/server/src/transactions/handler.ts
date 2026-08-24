import { createApiErrorBody, createApiSuccessResponse } from '@/lib/api-response';
import { tsRest } from '@/lib/ts-rest';
import { handleRequestValidationError } from '@/middleware/api-errors';
import { requireSession } from '@/middleware/require-session';
import { transactionContract } from '@financeos/contract';
import { createExpressEndpoints } from '@ts-rest/express';
import type { IRouter } from 'express';

import { createTransaction, listTransactions } from './service';

const transactionRouter = tsRest.router(transactionContract, {
  list: {
    middleware: [requireSession()],
    handler: async ({ req, query }) => {
      const transactionList = await listTransactions({ user: req.user, query });

      if (!transactionList) {
        return { status: 404, body: createApiErrorBody(404, 'Financial account not found.') } as const;
      }

      return createApiSuccessResponse(200, transactionList, 'Transactions retrieved successfully.');
    },
  },
  create: {
    middleware: [requireSession()],
    handler: async ({ req, body }) => {
      const result = await createTransaction({ user: req.user, body });

      if ('status' in result) {
        if (result.status === 400) {
          return { status: 400, body: createApiErrorBody(400, result.message) } as const;
        }

        return { status: 404, body: createApiErrorBody(404, result.message) } as const;
      }

      return createApiSuccessResponse(201, result, 'Transaction created successfully.');
    },
  },
});

export const registerTransactionRoutes = (app: IRouter) =>
  createExpressEndpoints(transactionContract, transactionRouter, app, {
    requestValidationErrorHandler: handleRequestValidationError,
    responseValidation: true,
  });
