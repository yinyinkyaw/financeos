import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { apiSuccessResponseSchema, commonApiErrorResponses } from './api-response';

const c = initContract();

const categorySchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string().nullable(),
  parent: z
    .object({
      id: z.string(),
      name: z.string(),
      color: z.string().nullable(),
    })
    .nullable(), // null = top-level category, set = child category
});

export type Category = z.infer<typeof categorySchema>;

export const categoryContract = c.router(
  {
    list: {
      method: 'GET',
      path: '/categories',
      responses: {
        200: apiSuccessResponseSchema(200, z.array(categorySchema)),
      },
    },
    create: {
      method: 'POST',
      path: '/categories',
      body: z.object({
        name: z.string(),
        type: z.enum(['income', 'expense']),
        color: z.string().optional(),
        parentId: z.string().nullable(),
      }),
      responses: {
        200: apiSuccessResponseSchema(200, categorySchema),
      },
    },
    update: {
      method: 'PUT',
      path: '/categories/:id',
      body: z.object({
        name: z.string(),
        type: z.enum(['income', 'expense']),
        color: z.string().optional(),
        parentId: z.string().nullable(),
      }),
      responses: {
        200: apiSuccessResponseSchema(200, categorySchema),
      },
    },
  },
  {
    commonResponses: commonApiErrorResponses,
    strictStatusCodes: true,
  }
);
