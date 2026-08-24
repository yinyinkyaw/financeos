export function createApiSuccessResponse<TStatus extends number, TBody>(status: TStatus, body: TBody, message: string) {
  return {
    status,
    body: {
      status,
      body,
      message,
    },
  } as const;
}

export function createApiErrorBody<TStatus extends number>(status: TStatus, message: string, body?: unknown) {
  return {
    status,
    ...(body === undefined ? {} : { body }),
    message,
  };
}
