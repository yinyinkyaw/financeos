import cors from 'cors';
import express from 'express';
import { registerAuthRoutes } from '@/auth';
import { getServerEnv } from '../env';
import { registerCategoryRoutes } from './categories/handler';
import { registerFinanceAccountRoutes } from './finance-accounts/handler';
import { createApiSuccessResponse } from './lib/api-response';
import { handleApiError, handleRouteNotFound } from './middleware/api-errors';
import { registerSessionRoutes } from './session/handler';

const { FRONTEND_URL } = getServerEnv();

export const createApp = () => {
  const app = express();
  app.use(
    cors({
      origin: FRONTEND_URL,
      credentials: true,
    })
  );
  registerAuthRoutes(app);
  app.use(express.json());

  app.get('/health-check', (_req, res) => {
    const response = createApiSuccessResponse(200, 'Hello Express!', 'Health check successful.');
    res.status(response.status).json(response.body);
  });

  const apiRouter = express.Router();
  registerSessionRoutes(apiRouter);
  registerCategoryRoutes(apiRouter);
  registerFinanceAccountRoutes(apiRouter);
  app.use('/api', apiRouter);
  app.use(handleRouteNotFound);
  app.use(handleApiError);

  return app;
};
