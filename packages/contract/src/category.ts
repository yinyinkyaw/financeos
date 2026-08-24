import { initContract, type ServerInferRequest } from '@ts-rest/core';
import { z } from 'zod';
import { apiErrorResponseSchema, apiSuccessResponseSchema, commonApiErrorResponses } from './api-response';

const c = initContract();

export const categoryIconNameSchema = z.enum([
  'tag',
  'circle-dollar-sign',
  'utensils',
  'bus',
  'shopping-bag',
  'receipt-text',
  'house',
  'heart-pulse',
  'shapes',
]);
export type CategoryIconName = z.infer<typeof categoryIconNameSchema>;

const categorySchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string().nullable(),
  iconName: categoryIconNameSchema,
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
        name: z.string().trim().min(1).max(100),
        iconName: categoryIconNameSchema.default('tag'),
      }),
      responses: {
        200: apiSuccessResponseSchema(200, categorySchema),
        409: apiErrorResponseSchema(409),
      },
    },
  },
  {
    commonResponses: commonApiErrorResponses,
    strictStatusCodes: true,
  }
);

export type CreateCategoryBody = ServerInferRequest<typeof categoryContract.create>['body'];
