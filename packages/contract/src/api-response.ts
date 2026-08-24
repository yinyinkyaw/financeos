import { z } from 'zod';

export const apiSuccessResponseSchema = <TStatus extends number, TBody extends z.ZodType>(
  status: TStatus,
  body: TBody
) =>
  z.object({
    status: z.literal(status),
    body,
    message: z.string(),
  });

export const apiErrorResponseSchema = <TStatus extends number>(status: TStatus) =>
  z.object({
    status: z.literal(status),
    body: z.unknown().optional(),
    message: z.string(),
  });

export const commonApiErrorResponses = {
  400: apiErrorResponseSchema(400),
  401: apiErrorResponseSchema(401),
  404: apiErrorResponseSchema(404),
  500: apiErrorResponseSchema(500),
};
