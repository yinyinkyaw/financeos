import { authContract } from '@financeos/contract/src/auth';
import { createExpressEndpoints } from '@ts-rest/express';
import { fromNodeHeaders } from 'better-auth/node';
import type { IRouter } from 'express';

import { auth } from '@/lib/auth';
import { createApiSuccessResponse } from '@/lib/api-response';
import { tsRest } from '@/lib/ts-rest';
import { handleRequestValidationError } from '@/middleware/api-errors';

const sessionRouter = tsRest.router(authContract, {
  getSession: async ({ req }) => {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    return createApiSuccessResponse(200, session, 'Session retrieved successfully.');
  },
});

export const registerSessionRoutes = (app: IRouter) =>
  createExpressEndpoints(authContract, sessionRouter, app, {
    requestValidationErrorHandler: handleRequestValidationError,
    responseValidation: true,
  });
