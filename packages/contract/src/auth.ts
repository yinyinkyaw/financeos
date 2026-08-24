import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { apiSuccessResponseSchema, commonApiErrorResponses } from './api-response';

const c = initContract();

const serverSessionSchema = z.object({
  session: z.record(z.string(), z.unknown()),
  user: z.record(z.string(), z.unknown()),
});

export const authContract = c.router(
  {
    getSession: {
      method: 'GET',
      path: '/session',
      responses: {
        200: apiSuccessResponseSchema(200, serverSessionSchema.nullable()),
      },
    },
  },
  {
    commonResponses: commonApiErrorResponses,
    strictStatusCodes: true,
  }
);
