import { tsRest } from '@/lib/ts-rest';
import { requireSession } from '@/middleware/require-session';
import { categoryContract } from '@financeos/contract/src/category';
import { createExpressEndpoints } from '@ts-rest/express';
import type { IRouter } from 'express';
import { createCategory, getCategories } from './service';
import { createApiErrorBody, createApiSuccessResponse } from '@/lib/api-response';
import { handleRequestValidationError } from '@/middleware/api-errors';

const categoriesRouter = tsRest.router(categoryContract, {
  list: {
    middleware: [requireSession()],
    handler: async ({ req }) =>
      createApiSuccessResponse(200, await getCategories({ user: req.user }), 'Categories retrieved successfully.'),
  },
  create: {
    middleware: [requireSession()],
    handler: async ({ req, body }) => {
      const category = await createCategory({ user: req.user, body });

      if (!category) {
        return { status: 409, body: createApiErrorBody(409, 'A category with this name already exists.') } as const;
      }

      return createApiSuccessResponse(200, category, 'Category created successfully.');
    },
  },
});

export const registerCategoryRoutes = (app: IRouter) =>
  createExpressEndpoints(categoryContract, categoriesRouter, app, {
    requestValidationErrorHandler: handleRequestValidationError,
    responseValidation: true,
  });
