import { createApiSuccessResponse } from '@/lib/api-response';
import { tsRest } from '@/lib/ts-rest';
import { handleRequestValidationError } from '@/middleware/api-errors';
import { requireSession } from '@/middleware/require-session';
import { categoryExpenseSummaryContract } from '@financeos/contract';
import { createExpressEndpoints } from '@ts-rest/express';
import type { IRouter } from 'express';

import { getCategoryExpenseSummaries } from './service';

const BANGKOK_YEAR_FORMATTER = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  timeZone: 'Asia/Bangkok',
});

function getCurrentBangkokYear(): number {
  return Number(BANGKOK_YEAR_FORMATTER.format(new Date()));
}

const categoryExpenseSummaryRouter = tsRest.router(categoryExpenseSummaryContract, {
  list: {
    middleware: [requireSession()],
    handler: async ({ req, query }) => {
      const year = query.year ?? getCurrentBangkokYear();
      const summary = await getCategoryExpenseSummaries({ user: req.user, year });
      return createApiSuccessResponse(200, summary, 'Category expense summaries retrieved successfully.');
    },
  },
});

export const registerCategoryExpenseSummaryRoutes = (app: IRouter) =>
  createExpressEndpoints(categoryExpenseSummaryContract, categoryExpenseSummaryRouter, app, {
    requestValidationErrorHandler: handleRequestValidationError,
    responseValidation: true,
  });
