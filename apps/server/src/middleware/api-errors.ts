import { RequestValidationError } from '@ts-rest/express';
import type { ErrorRequestHandler, NextFunction, Request, Response } from 'express';

import { createApiErrorBody } from '@/lib/api-response';

function getValidationIssues(error: { issues?: unknown } | null) {
  return error?.issues ?? null;
}

export function handleRequestValidationError(
  error: RequestValidationError,
  _request: unknown,
  response: Response,
  _next: NextFunction
) {
  const validationErrors = {
    pathParameters: getValidationIssues(error.pathParams),
    headers: getValidationIssues(error.headers),
    queryParameters: getValidationIssues(error.query),
    body: getValidationIssues(error.body),
  };

  response.status(400).json(createApiErrorBody(400, 'Request validation failed.', validationErrors));
}

export function handleRouteNotFound(_request: Request, response: Response) {
  response.status(404).json(createApiErrorBody(404, 'Endpoint not found.'));
}

function isMalformedJsonError(error: unknown): error is SyntaxError & { status: 400 } {
  return error instanceof SyntaxError && 'status' in error && error.status === 400;
}

export const handleApiError: ErrorRequestHandler = (error, _request, response, _next) => {
  if (isMalformedJsonError(error)) {
    response.status(400).json(createApiErrorBody(400, 'Request body contains invalid JSON.'));
    return;
  }

  console.error(error);
  response.status(500).json(createApiErrorBody(500, 'Internal server error.'));
};
