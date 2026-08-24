import { tsRest } from '@/lib/ts-rest';
import { requireSession } from '@/middleware/require-session';
import { financeAccountContract } from '@financeos/contract/src/finance-account';
import { createExpressEndpoints } from '@ts-rest/express';
import type { IRouter } from 'express';
import { createFinanceAccount, getFinanceAccounts } from './service';
import { createApiSuccessResponse } from '@/lib/api-response';
import { handleRequestValidationError } from '@/middleware/api-errors';

const financeAccountsRouter = tsRest.router(financeAccountContract, {
  list: {
    middleware: [requireSession()],
    handler: async ({ req }) =>
      createApiSuccessResponse(
        200,
        await getFinanceAccounts({ user: req.user }),
        'Finance accounts retrieved successfully.'
      ),
  },
  create: {
    middleware: [requireSession()],
    handler: async ({ req, body }) =>
      createApiSuccessResponse(
        200,
        await createFinanceAccount({ user: req.user, body }),
        'Finance account created successfully.'
      ),
  },
});

export const registerFinanceAccountRoutes = (app: IRouter) =>
  createExpressEndpoints(financeAccountContract, financeAccountsRouter, app, {
    requestValidationErrorHandler: handleRequestValidationError,
    responseValidation: true,
  });
