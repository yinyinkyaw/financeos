import { tsRest } from '@/lib/ts-rest';
import { requireSession } from '@/middleware/require-session';
import { categoryContract } from '@financeos/contract/src/category';
import { createExpressEndpoints } from '@ts-rest/express';
import type { IRouter } from 'express';
import { getCategories } from './service';
import { createApiSuccessResponse } from '@/lib/api-response';
import { handleRequestValidationError } from '@/middleware/api-errors';

const categoriesRouter = tsRest.router(categoryContract, {
  list: {
    middleware: [requireSession()],
    handler: async ({ req }) =>
      createApiSuccessResponse(200, await getCategories({ user: req.user }), 'Categories retrieved successfully.'),
  },
});

export const registerCategoryRoutes = (app: IRouter) =>
  createExpressEndpoints(categoryContract, categoriesRouter, app, {
    requestValidationErrorHandler: handleRequestValidationError,
    responseValidation: true,
  });
