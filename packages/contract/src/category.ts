import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { apiSuccessResponseSchema, commonApiErrorResponses } from './api-response';

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
  parent: z
    .object({
      id: z.string(),
      name: z.string(),
      color: z.string().nullable(),
      iconName: categoryIconNameSchema,
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
  },
  {
    commonResponses: commonApiErrorResponses,
    strictStatusCodes: true,
  }
);
