import { apiContract } from '@financeos/contract';
import { initTsrReactQuery } from '@ts-rest/react-query/v5';
import { env } from '@/env';

export const tsr = initTsrReactQuery(apiContract, {
  baseUrl: `${env.NEXT_PUBLIC_BACKEND_URL}/api`,
  baseHeaders: {},
  credentials: 'include',
});
